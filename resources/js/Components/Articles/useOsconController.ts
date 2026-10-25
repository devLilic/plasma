import {useCallback, useEffect, useRef, useState} from 'react';
import {Article, MosObject} from '@/types';
import {osconFailureHint} from './osconDiagnostics.js';

export interface OsconProfile {
    id: string | number
    template: string
    group: string
    behavior: 'generic' | 'person'
    params: string[]
}

export interface OsconSource {
    playlistId: number
    articleId: number
    mosObjectKey: string
    revision: string
}

export interface OsconPending {
    commandId: string
    template: string
    source: OsconSource | null
}

export interface OsconGroupState {
    id: string
    state: string
    busy: boolean
    activeTemplate: string | null
    source: OsconSource | null
    pending: OsconPending | null
    personExpiresAt: number | null
}

interface OsconHealth {
    service: string
    softwareVersion: string
    protocolVersion: number
    ready: boolean
    capabilities: string[]
}

interface OsconState { groups: OsconGroupState[]; [key: string]: unknown }
interface OsconApiResponse { ok?: boolean; error?: string; state?: {groups?: OsconGroupState[]; [key: string]: unknown}; [key: string]: unknown }
interface ConnectionSettings { endpoint: string; token: string; timeoutMs: number }

export type OsconConnectionStatus = 'unchecked' | 'connecting' | 'connected' | 'stale' | 'error'
export interface OsconLastCommand {
    status: 'sending' | 'accepted' | 'pending' | 'uncertain' | 'failed'
    commandId: string
    template: string
    articleTitle: string
    error?: string
}

const REQUIRED_CAPABILITIES = ['mos-profile-play-v1', 'group-state-v1'] as const;

class OsconHttpError extends Error {
    constructor(message: string, readonly statusCode: number) { super(message); }
}

async function jsonRequest<T>(url: string, token: string, timeoutMs: number, method = 'GET', body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method,
            headers: {Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body ? {'Content-Type': 'application/json'} : {})},
            body: body ? JSON.stringify(body) : undefined,
            mode: 'cors', credentials: 'omit', cache: 'no-store', signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({})) as T & {error?: string};
        if (!response.ok || (typeof payload === 'object' && payload !== null && 'ok' in payload && payload.ok === false)) {
            throw new OsconHttpError(payload?.error || `OSCon a răspuns cu HTTP ${response.status}.`, response.status);
        }
        return payload;
    } finally {
        window.clearTimeout(timer);
    }
}

const errorText = (reason: unknown) => reason instanceof DOMException && reason.name === 'AbortError'
    ? 'Conexiunea OSCon a expirat. Reconectează-te explicit pentru a reîncerca.'
    : reason instanceof Error ? reason.message : 'Conexiunea OSCon a eșuat.';

export function useOsconController() {
    const tokenRef = useRef<string | null>(null);
    const endpointRef = useRef('');
    const timeoutRef = useRef(10_000);
    const pollRef = useRef<number | null>(null);
    const [status, setStatus] = useState<OsconConnectionStatus>('unchecked');
    const [profiles, setProfiles] = useState<OsconProfile[]>([]);
    const [softwareVersion, setSoftwareVersion] = useState<string | null>(null);
    const [groups, setGroups] = useState<OsconGroupState[]>([]);
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [lastCommand, setLastCommand] = useState<OsconLastCommand | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorHint, setErrorHint] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [lastStateAt, setLastStateAt] = useState<number | null>(null);

    const applyState = useCallback((value: OsconState | OsconApiResponse['state'] | undefined) => {
        if (!value || !Array.isArray(value.groups)) return false;
        setGroups(value.groups);
        setLastStateAt(Date.now());
        return true;
    }, []);

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) window.clearInterval(pollRef.current);
        pollRef.current = null;
    }, []);

    const refreshState = useCallback(async () => {
        const token = tokenRef.current;
        const endpoint = endpointRef.current;
        if (!token || !endpoint) return false;
        try {
            const data = await jsonRequest<OsconApiResponse>(`${endpoint}/v1/state`, token, timeoutRef.current);
            if (!applyState(data.state)) throw new Error('Răspuns OSCon fără starea grupurilor.');
            setError(null);
            setErrorHint(null);
            setStatus('connected');
            return true;
        } catch (reason) {
            setError(errorText(reason));
            setErrorHint(osconFailureHint(reason));
            setStatus('stale');
            stopPolling();
            return false;
        }
    }, [applyState, stopPolling]);

    const connect = useCallback(async () => {
        setBusy(true); setStatus('connecting'); setError(null); setErrorHint(null); stopPolling();
        tokenRef.current = null;
        try {
            const response = await fetch(route('oscon.connection'), {headers: {Accept: 'application/json'}, credentials: 'same-origin', cache: 'no-store'});
            const settings = await response.json() as ConnectionSettings & {error?: string};
            if (!response.ok || !settings.endpoint || !settings.token) throw new Error(settings.error || 'Setările OSCon nu sunt disponibile. Verifică tokenul din profil.');
            const endpoint = settings.endpoint.replace(/\/+$/, '');
            const timeout = Number.isFinite(settings.timeoutMs) ? Math.max(1_000, settings.timeoutMs) : 10_000;
            const health = await jsonRequest<OsconHealth>(`${endpoint}/v1/health`, settings.token, timeout);
            if (health.service !== 'oscon' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(health.softwareVersion || '') || health.protocolVersion !== 1 || !health.ready) throw new Error('Identitatea, versiunea sau protocolul OSCon nu sunt compatibile ori serviciul nu este pregătit.');
            const missing = REQUIRED_CAPABILITIES.filter(capability => !health.capabilities?.includes(capability));
            if (missing.length) throw new Error(`OSCon nu oferă capabilitățile necesare: ${missing.join(', ')}.`);
            const [profileResponse, stateResponse] = await Promise.all([
                jsonRequest<{mosProfiles?: OsconProfile[]}>(`${endpoint}/v1/profiles`, settings.token, timeout),
                jsonRequest<OsconApiResponse>(`${endpoint}/v1/state`, settings.token, timeout),
            ]);
            if (!Array.isArray(profileResponse.mosProfiles)) throw new Error('Răspuns OSCon fără profilurile MOS configurate.');
            if (!stateResponse.state || !Array.isArray(stateResponse.state.groups)) throw new Error('Răspuns OSCon fără starea grupurilor.');
            tokenRef.current = settings.token;
            endpointRef.current = endpoint;
            timeoutRef.current = timeout;
            setProfiles(profileResponse.mosProfiles);
            setSoftwareVersion(health.softwareVersion);
            setCapabilities(health.capabilities);
            applyState(stateResponse.state);
            setStatus('connected');
            setError(null);
            setErrorHint(null);
            pollRef.current = window.setInterval(() => { void refreshState(); }, 2_000);
        } catch (reason) {
            tokenRef.current = null;
            endpointRef.current = '';
            setStatus('error');
            setError(errorText(reason));
            setErrorHint(osconFailureHint(reason));
        } finally { setBusy(false); }
    }, [applyState, refreshState, stopPolling]);

    const disconnect = useCallback(() => {
        stopPolling(); tokenRef.current = null; endpointRef.current = '';
        setStatus('unchecked'); setProfiles([]); setSoftwareVersion(null); setGroups([]); setCapabilities([]); setLastCommand(null); setError(null); setErrorHint(null); setLastStateAt(null);
    }, [stopPolling]);

    const sendPlay = useCallback(async (article: Article, object: MosObject, profile: OsconProfile, params: Record<string, string>) => {
        const token = tokenRef.current;
        const endpoint = endpointRef.current;
        if (!token || !endpoint || !object.objectKey || !object.revision) throw new Error('Reconectează OSCon și reîncarcă starea MOS înainte de PLAY.');
        const commandId = crypto.randomUUID();
        const source: OsconSource = {playlistId: article.playlist_id, articleId: article.id, mosObjectKey: object.objectKey, revision: object.revision};
        setBusy(true); setLastCommand({status: 'sending', commandId, template: profile.template, articleTitle: article.subtitle || article.title || article.technical_title});
        try {
            const response = await jsonRequest<OsconApiResponse>(`${endpoint}/v1/play`, token, timeoutRef.current, 'POST', {commandId, template: profile.template, params, source});
            if (!applyState(response.state)) await refreshState();
            setLastCommand({status: response.state?.groups?.some(group => group.pending?.commandId === commandId) ? 'pending' : 'accepted', commandId, template: profile.template, articleTitle: article.subtitle || article.title || article.technical_title});
        } catch (reason) {
            const rejected = reason instanceof OsconHttpError && reason.statusCode >= 400 && reason.statusCode < 500;
            setLastCommand({status: rejected ? 'failed' : 'uncertain', commandId, template: profile.template, articleTitle: article.subtitle || article.title || article.technical_title, error: errorText(reason)});
            setError(rejected ? errorText(reason) : `${errorText(reason)} Verifică starea OSCon; comanda nu va fi retrimisă automat.`);
            if (!rejected) { setStatus('stale'); stopPolling(); }
        } finally { setBusy(false); }
    }, [applyState, refreshState, stopPolling]);

    const sendStop = useCallback(async (template: string, scope: 'profile' | 'group') => {
        const token = tokenRef.current;
        const endpoint = endpointRef.current;
        if (!token || !endpoint) throw new Error('Conectează-te explicit la OSCon înainte de STOP.');
        const commandId = crypto.randomUUID();
        setBusy(true);
        setLastCommand({status: 'sending', commandId, template, articleTitle: 'STOP'});
        try {
            const response = await jsonRequest<OsconApiResponse>(`${endpoint}/v1/stop`, token, timeoutRef.current, 'POST', {commandId, template, scope});
            if (!applyState(response.state)) await refreshState();
            setLastCommand({status: 'accepted', commandId, template, articleTitle: 'STOP'});
            setError(null);
        } catch (reason) {
            const rejected = reason instanceof OsconHttpError && reason.statusCode >= 400 && reason.statusCode < 500;
            setLastCommand({status: rejected ? 'failed' : 'uncertain', commandId, template, articleTitle: 'STOP', error: errorText(reason)});
            setError(rejected ? errorText(reason) : `${errorText(reason)} Verifică starea OSCon; comanda STOP nu va fi retrimisă automat.`);
            if (!rejected) { setStatus('stale'); stopPolling(); }
        } finally { setBusy(false); }
    }, [applyState, refreshState, stopPolling]);

    useEffect(() => () => { stopPolling(); tokenRef.current = null; endpointRef.current = ''; }, [stopPolling]);

    return {status, profiles, softwareVersion, groups, capabilities, lastCommand, error, errorHint, busy, lastStateAt, connect, disconnect, refreshState, sendPlay, sendStop};
}
