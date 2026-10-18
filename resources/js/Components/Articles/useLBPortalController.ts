import {useCallback, useEffect, useState} from 'react';
import {MosObject} from '@/types';

export type LBPortalStatus = 'loading' | 'ready' | 'unconfigured' | 'error';
export type MosPlaybackAction = 'PLAY' | 'RESUME';
export type MosPlaybackState = {onAir: boolean; sectionId: string | null};

interface LBPortalConnection {endpoint: string; accessKey: string; timeoutMs?: number}

export function localizeLBPortalMessage(message: string): string {
    const missingParameters = message.match(/^Missing mapped parameter\(s\):\s*(.+)$/i);
    if (missingParameters) return `Lipsesc parametrii mapați: ${missingParameters[1]}`;

    const knownMessages: Record<string, string> = {
        'No saved MOS mapping matches this template.': 'Nu există o mapare MOS salvată pentru acest template.',
        'Plasma execution is disabled for standalone projects.': 'Trimiterea comenzilor Plasma este dezactivată pentru proiectele independente.',
        'Section needs operator resync.': 'Secțiunea necesită resincronizare din LB-Portal.',
        'LiveBoard operation queue is full.': 'Coada de comenzi LiveBoard este plină. Încearcă din nou în câteva momente.',
        'LiveBoard disconnected during execution.': 'Conexiunea cu LiveBoard s-a întrerupt în timpul executării comenzii.',
        'LiveBoard disconnected before auto-exit; operator resync required.': 'Conexiunea cu LiveBoard s-a întrerupt înainte de închiderea automată. Secțiunea necesită resincronizare.',
    };

    return knownMessages[message] || message;
}

export function createRequestId(): string {
    const cryptoApi = globalThis.crypto;
    if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();

    const bytes = new Uint8Array(16);
    if (typeof cryptoApi?.getRandomValues === 'function') cryptoApi.getRandomValues(bytes);
    else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function useLBPortalController() {
    const [connection, setConnection] = useState<LBPortalConnection | null>(null);
    const [status, setStatus] = useState<LBPortalStatus>('loading');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [lastPlayedObjectKey, setLastPlayedObjectKey] = useState<string | null>(null);
    const [playbackStates, setPlaybackStates] = useState<Record<string, MosPlaybackState>>({});

    useEffect(() => {
        let disposed = false;
        fetch(route('lb-portal.connection'), {headers: {Accept: 'application/json'}, credentials: 'same-origin', cache: 'no-store'})
            .then(async response => {
                if (response.status === 422 || response.status === 404) return null;
                if (!response.ok) throw new Error('Setările LB-Portal nu au putut fi citite.');
                return await response.json() as LBPortalConnection;
            })
            .then(value => {
                if (disposed) return;
                if (!value?.endpoint || !value.accessKey) { setStatus('unconfigured'); return; }
                setConnection(value);
                setStatus('ready');
            })
            .catch(() => { if (!disposed) setStatus('error'); });
        return () => { disposed = true; };
    }, []);

    const sendPlay = useCallback(async (object: MosObject, action: MosPlaybackAction = 'PLAY'): Promise<boolean> => {
        if (!connection || status !== 'ready') {
            setMessage(`Configurează conexiunea LB-Portal în Setări înainte de ${action}.`);
            return false;
        }
        const hasTextValues = object.editableObjects.some(field => field.value.trim() !== '');
        const params = hasTextValues ? Object.fromEntries(object.editableObjects.map(field => [field.name, field.value])) : undefined;
        const requestId = createRequestId();
        const payload = {
            requestId,
            source: 'plasma.test',
            type: action === 'PLAY' ? 'mos-play' : 'mos-resume',
            template: object.slug,
            ...(action === 'PLAY' && params ? {params} : {}),
        };
        setBusy(true);
        setMessage(null);
        try {
            const abortController = new AbortController();
            const timeout = window.setTimeout(() => abortController.abort(), connection.timeoutMs ?? 5000);
            let response: Response;
            try {
                response = await fetch(`${connection.endpoint}/v1/requests`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${connection.accessKey}`},
                    body: JSON.stringify(payload),
                    cache: 'no-store',
                    signal: abortController.signal,
                });
            } finally { window.clearTimeout(timeout); }
            const result = await response.json().catch(() => ({})) as {requestId?: string; error?: string; execution?: {status?: string; sectionId?: string | null; onAir?: boolean; error?: string | null}};
            if (!response.ok || result.requestId !== requestId) throw new Error(result.error || `LB-Portal a răspuns cu HTTP ${response.status}.`);
            const objectKey = object.objectKey || object.commandId;
            if (!result.execution || !['completed', 'noop'].includes(result.execution.status || '')) throw new Error(result.execution?.error || result.error || 'LB-Portal nu a confirmat starea graficii de la LiveBoard.');
            if (action === 'PLAY' && result.execution.onAir) {
                setPlaybackStates(current => {
                    const next = {...current};
                    if (result.execution?.sectionId) for (const [key, state] of Object.entries(next)) if (state.sectionId === result.execution.sectionId) next[key] = {...state, onAir: false};
                    next[objectKey] = {onAir: true, sectionId: result.execution?.sectionId ?? null};
                    return next;
                });
                setLastPlayedObjectKey(objectKey);
            } else if (action === 'RESUME' && result.execution.onAir === false) {
                setPlaybackStates(current => ({...current, [objectKey]: {onAir: false, sectionId: result.execution?.sectionId ?? current[objectKey]?.sectionId ?? null}}));
                setLastPlayedObjectKey(current => current === objectKey ? null : current);
            } else {
                throw new Error('LiveBoard nu a confirmat schimbarea stării graficii.');
            }
            setMessage(null);
            return true;
        } catch (error) {
            setMessage(error instanceof Error && error.name === 'AbortError'
                ? 'LB-Portal nu a răspuns în 5 secunde. Verifică aplicația, IP-ul și portul.'
                : error instanceof Error ? localizeLBPortalMessage(error.message) : 'Cererea către LB-Portal a eșuat.');
            return false;
        } finally { setBusy(false); }
    }, [connection, status]);

    return {status, busy, message, lastPlayedObjectKey, playbackStates, sendPlay};
}
