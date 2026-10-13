import React, {FormEvent, useEffect, useRef, useState} from 'react';
import {Head} from '@inertiajs/react';
import {CheckCircleIcon, ExclamationCircleIcon, PlayIcon, SignalIcon, SparklesIcon, StopIcon} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {PageProps} from '@/types';

const API_BASE = 'http://127.0.0.1:47833';
const TOKEN_KEY = 'plasma.llc-test.token';
const REQUEST_TIMEOUT_MS = 10_000;
const initialKicker = 'TEST LAB — Ă Â Î Ș Ț';
const initialTitle = 'Verificare text lung, spații și actualizare simultană a celor două câmpuri';
const kickerSamples = [
    initialKicker,
    'ACTUALITATE',
    'ȘTIINȚĂ ȘI TEHNOLOGIE',
    'EDUCAȚIE',
    'CULTURĂ ȘI COMUNITATE',
];
const titleSamples = [
    initialTitle,
    'Știința și tehnologia deschid noi perspective',
    'Idei noi și inițiative locale în prim-plan',
    'Educația și cultura aduc comunitatea împreună',
    'O nouă etapă pentru proiectele comunității',
];

type HeadlineState = {
    state: 'OFF' | 'ON_A' | 'SWAPPING_A_B' | 'ON_B' | 'SWAPPING_B_A' | 'NEEDS_RESYNC' | 'SUSPENDED_FOR_PERSON';
    busy: boolean;
    activeItemId: string | null;
    activeBuffer: 'A' | 'B' | null;
    bufferFields?: Readonly<Record<'A' | 'B', Readonly<{primary: string; secondary: string}> | null>>;
    lastError: string | null;
    confirmation: 'LOCAL/UNCONFIRMED';
};

type ApiResponse = {
    ok?: boolean;
    service?: string;
    protocolVersion?: number;
    error?: string;
    state?: {headline?: unknown};
};

class ApiError extends Error {
    constructor(message: string, readonly status: number, readonly response: ApiResponse | null) {
        super(message);
    }
}

const headlineStates = new Set<HeadlineState['state']>([
    'OFF', 'ON_A', 'SWAPPING_A_B', 'ON_B', 'SWAPPING_B_A', 'NEEDS_RESYNC', 'SUSPENDED_FOR_PERSON',
]);

const isHeadlineState = (value: unknown): value is HeadlineState => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    const fields = candidate.bufferFields;
    const validFields = fields === undefined || (!!fields && typeof fields === 'object' && !Array.isArray(fields)
        && Object.keys(fields).length === 2
        && ['A', 'B'].every(buffer => {
            const bufferFields = (fields as Record<string, unknown>)[buffer];
            return bufferFields === null || (!!bufferFields && typeof bufferFields === 'object'
                && !Array.isArray(bufferFields)
                && Object.keys(bufferFields).length === 2
                && Object.prototype.hasOwnProperty.call(bufferFields, 'primary')
                && Object.prototype.hasOwnProperty.call(bufferFields, 'secondary')
                && typeof (bufferFields as Record<string, unknown>).primary === 'string'
                && typeof (bufferFields as Record<string, unknown>).secondary === 'string');
        }));
    return validFields
        && typeof candidate.state === 'string' && headlineStates.has(candidate.state as HeadlineState['state'])
        && typeof candidate.busy === 'boolean'
        && (typeof candidate.activeItemId === 'string' || candidate.activeItemId === null)
        && (candidate.activeBuffer === null || candidate.activeBuffer === 'A' || candidate.activeBuffer === 'B')
        && (typeof candidate.lastError === 'string' || candidate.lastError === null)
        && candidate.confirmation === 'LOCAL/UNCONFIRMED';
};

const readSavedToken = (): string => {
    if (typeof window === 'undefined') return '';
    try {
        return window.sessionStorage.getItem(TOKEN_KEY) ?? '';
    } catch {
        return '';
    }
};

const TestPage = ({auth}: PageProps) => {
    const [token, setToken] = useState(readSavedToken);
    const [kicker, setKicker] = useState(initialKicker);
    const [title, setTitle] = useState(initialTitle);
    const [connected, setConnected] = useState(false);
    const [busy, setBusy] = useState(false);
    const [headline, setHeadline] = useState<HeadlineState | null>(null);
    const [message, setMessage] = useState('Introdu tokenul copiat din LLC Diagnostics și conectează-te.');
    const [error, setError] = useState(false);
    const requestRef = useRef<AbortController | null>(null);
    const busyRef = useRef(false);

    useEffect(() => () => requestRef.current?.abort(), []);

    const setRequestBusy = (value: boolean) => {
        busyRef.current = value;
        setBusy(value);
    };

    const generateDifferent = (samples: string[], currentValue: string, setValue: (value: string) => void) => {
        const choices = samples.filter(sample => sample !== currentValue);
        if (choices.length === 0) return;
        setValue(choices[Math.floor(Math.random() * choices.length)]);
    };

    const request = async (path: string, method: 'GET' | 'POST', body?: object): Promise<ApiResponse> => {
        const controller = new AbortController();
        requestRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(`${API_BASE}${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token.trim()}`,
                    Accept: 'application/json',
                    ...(body ? {'Content-Type': 'application/json'} : {}),
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store',
            });
            let data: ApiResponse;
            try {
                data = await response.json() as ApiResponse;
            } catch {
                throw new ApiError(response.status === 401 ? 'TOKEN_INVALID' : `Răspuns LLC invalid (HTTP ${response.status}).`, response.status, null);
            }
            if (!response.ok || data.ok !== true) {
                throw new ApiError(data.error || (response.status === 401 ? 'TOKEN_INVALID' : `LLC a răspuns cu HTTP ${response.status}.`), response.status, data);
            }
            return data;
        } finally {
            window.clearTimeout(timeout);
            if (requestRef.current === controller) requestRef.current = null;
        }
    };

    const friendlyError = (reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401) {
            return 'Token invalid (401). Copiază din nou tokenul din LLC Diagnostics.';
        }
        if (reason instanceof DOMException && reason.name === 'AbortError') {
            return 'Cererea a expirat sau a fost întreruptă. Rezultatul comenzii poate fi incert; conectează-te din nou pentru a citi starea. Verifică pornirea LLC și permisiunea browserului pentru acces la rețeaua locală.';
        }
        return `${reason instanceof Error ? reason.message : 'Eroare de rețea.'} Verifică dacă LLC rulează pe acest calculator și dacă browserul permite accesul la rețeaua locală.`;
    };

    const handleTokenChange = (value: string) => {
        requestRef.current?.abort();
        setToken(value);
        setConnected(false);
        setHeadline(null);
        setError(false);
        setMessage('Tokenul s-a schimbat. Conectează-te din nou.');
        try {
            if (value.trim()) window.sessionStorage.setItem(TOKEN_KEY, value);
            else window.sessionStorage.removeItem(TOKEN_KEY);
        } catch {
            // Browser storage can be unavailable; the in-memory token still works.
        }
    };

    const connect = async (event: FormEvent) => {
        event.preventDefault();
        if (busyRef.current) return;
        if (!token.trim()) {
            setError(true);
            setMessage('Introdu tokenul copiat din LLC Diagnostics.');
            return;
        }
        setRequestBusy(true);
        setConnected(false);
        setHeadline(null);
        setError(false);
        setMessage('Se verifică serviciul LLC…');
        try {
            const health = await request('/v1/health', 'GET');
            if (health.service !== 'liveboard-lab-controller' || health.protocolVersion !== 1) {
                throw new Error('Serviciu LLC sau versiune de protocol neașteptată.');
            }
            let candidate = health.state?.headline;
            if (!isHeadlineState(candidate)) {
                const stateResponse = await request('/v1/state', 'GET');
                candidate = stateResponse.state?.headline;
            }
            if (!isHeadlineState(candidate)) throw new Error('Răspuns LLC fără starea headline validă.');
            setHeadline(candidate);
            setConnected(true);
            setMessage('Conectat la LLC.');
        } catch (reason) {
            const responseState = reason instanceof ApiError ? reason.response?.state?.headline : undefined;
            const hasValidState = isHeadlineState(responseState);
            if (hasValidState) setHeadline(responseState);
            if (!(reason instanceof ApiError) || reason.status === 401 || !hasValidState) setConnected(false);
            setError(true);
            setMessage(friendlyError(reason));
        } finally {
            setRequestBusy(false);
        }
    };

    const command = async (kind: 'play' | 'stop') => {
        if (!connected || busyRef.current) return;
        setRequestBusy(true);
        setError(false);
        setMessage(kind === 'play' ? 'Se trimite PLAY Titlu 4…' : 'Se trimite STOP Headline…');
        try {
            const response = kind === 'play'
                ? await request('/v1/play', 'POST', {itemId: 'headline-4', fields: {primary: kicker, secondary: title}})
                : await request('/v1/stop', 'POST', {template: 'headline'});
            const next = response.state?.headline;
            if (!isHeadlineState(next)) throw new Error('Comandă acceptată, dar răspunsul nu conține o stare headline validă.');
            setHeadline(next);
            setMessage('Comandă procesată de LLC; redare LiveBoard neconfirmată.');
        } catch (reason) {
            const responseState = reason instanceof ApiError ? reason.response?.state?.headline : undefined;
            const hasValidState = isHeadlineState(responseState);
            if (hasValidState) setHeadline(responseState);
            if (!(reason instanceof ApiError) || reason.status === 401 || !hasValidState) setConnected(false);
            setError(true);
            setMessage(friendlyError(reason));
        } finally {
            setRequestBusy(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Test LLC"/>
            <div className="ios-page">
                <header className="ios-page-header mx-auto max-w-3xl">
                    <div>
                        <p className="ios-eyebrow">Test local</p>
                        <h1 className="ios-title">Conexiune LLC</h1>
                        <p className="ios-subtitle">Trimite comenzi de test către LiveBoard Lab Controller din browserul acesta.</p>
                    </div>
                </header>
                <div className="mx-auto grid max-w-3xl gap-5">
                    <section className="ios-card p-5 sm:p-8">
                        <form onSubmit={connect}>
                            <label htmlFor="llc-token" className="mb-2 block text-sm font-semibold text-[#172033]">Token din LLC Diagnostics</label>
                            <input id="llc-token" type="password" autoComplete="off" spellCheck={false} value={token} disabled={busy}
                                   onChange={event => handleTokenChange(event.target.value)}
                                   className="w-full rounded-2xl border border-[#71809a]/20 bg-white/70 px-4 py-3 font-mono text-sm text-[#172033] outline-none focus:border-[#286ee7] focus:ring-2 focus:ring-[#286ee7]/15"
                                   placeholder="Lipește tokenul LLC"/>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#286ee7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e5dcc] disabled:cursor-wait disabled:opacity-60">
                                    <SignalIcon className="h-5 w-5"/>{busy ? 'Se procesează…' : 'Conectează'}
                                </button>
                                <span className={`inline-flex items-center gap-2 text-sm font-semibold ${connected ? 'text-[#238a45]' : 'text-[#65728a]'}`}>
                                    {connected ? <CheckCircleIcon className="h-5 w-5"/> : <span className="h-2.5 w-2.5 rounded-full bg-[#aab4c4]"/>}
                                    {connected ? 'Conectat' : 'Deconectat'}
                                </span>
                            </div>
                        </form>
                        <p role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'} className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm leading-6 ${error ? 'bg-[#ff3b30]/10 text-[#bd2d24]' : 'bg-white/45 text-[#53627a]'}`}>
                            {error && <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0"/>}{message}
                        </p>
                    </section>

                    <section className="ios-card overflow-hidden">
                        <div className="ios-card-header flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div><p className="ios-eyebrow">Headline</p><h2 className="ios-section-title">Comenzi de test</h2></div>
                            <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-[#65728a]">Template Titlu</span>
                        </div>
                        <div className="grid gap-5 p-5 sm:p-6">
                            <div className="grid gap-4">
                                <div>
                                    <label htmlFor="llc-title" className="mb-2 block text-sm font-semibold text-[#172033]">Titlu</label>
                                    <div className="flex gap-2">
                                        <input id="llc-title" type="text" maxLength={2000} value={title} disabled={busy}
                                               onChange={event => setTitle(event.target.value)}
                                               className="min-w-0 flex-1 rounded-2xl border border-[#71809a]/20 bg-white/70 px-4 py-3 text-sm text-[#172033] outline-none focus:border-[#286ee7] focus:ring-2 focus:ring-[#286ee7]/15 disabled:opacity-60"/>
                                        <button type="button" onClick={() => generateDifferent(titleSamples, title, setTitle)} disabled={busy}
                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[#71809a]/15 bg-white/60 px-3 py-2 text-xs font-semibold text-[#286ee7] hover:bg-white disabled:opacity-50">
                                            <SparklesIcon className="h-4 w-4"/>Generează titlu
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="llc-kicker" className="mb-2 block text-sm font-semibold text-[#172033]">Kicker</label>
                                    <div className="flex gap-2">
                                        <input id="llc-kicker" type="text" maxLength={2000} value={kicker} disabled={busy}
                                               onChange={event => setKicker(event.target.value)}
                                               className="min-w-0 flex-1 rounded-2xl border border-[#71809a]/20 bg-white/70 px-4 py-3 text-sm text-[#172033] outline-none focus:border-[#286ee7] focus:ring-2 focus:ring-[#286ee7]/15 disabled:opacity-60"/>
                                        <button type="button" onClick={() => generateDifferent(kickerSamples, kicker, setKicker)} disabled={busy}
                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[#71809a]/15 bg-white/60 px-3 py-2 text-xs font-semibold text-[#286ee7] hover:bg-white disabled:opacity-50">
                                            <SparklesIcon className="h-4 w-4"/>Generează kicker
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                            <button type="button" onClick={() => command('play')} disabled={!connected || busy}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#34c759] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2eae4e] disabled:cursor-not-allowed disabled:opacity-45">
                                <PlayIcon className="h-5 w-5"/>PLAY Titlu 4
                            </button>
                            <button type="button" onClick={() => command('stop')} disabled={!connected || busy}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff3b30] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e33329] disabled:cursor-not-allowed disabled:opacity-45">
                                <StopIcon className="h-5 w-5"/>STOP Headline
                            </button>
                            </div>
                        </div>
                        <p className="px-5 pb-5 text-sm leading-6 text-[#65728a] sm:px-6">PLAY trimite titlul și kickerul introduse. Generarea textului nu pornește grafica. Dacă modifici textul, PLAY îl actualizează; pentru repornirea aceleiași variante folosește STOP, apoi PLAY.</p>
                    </section>

                    <section className="ios-card p-5 sm:p-7">
                        <h2 className="ios-section-title">Starea raportată de LLC</h2>
                        {headline ? (
                            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                                <div><dt className="text-[#7c899d]">state</dt><dd className="mt-1 break-words font-semibold text-[#172033]">{headline.state}</dd></div>
                                <div><dt className="text-[#7c899d]">busy</dt><dd className="mt-1 font-semibold text-[#172033]">{headline.busy ? 'Da' : 'Nu'}</dd></div>
                                <div><dt className="text-[#7c899d]">activeItemId</dt><dd className="mt-1 break-words font-mono text-[#172033]">{headline.activeItemId ?? '—'}</dd></div>
                                <div><dt className="text-[#7c899d]">activeBuffer</dt><dd className="mt-1 break-words font-mono text-[#172033]">{headline.activeBuffer ?? '—'}</dd></div>
                                <div><dt className="text-[#7c899d]">lastError</dt><dd className="mt-1 break-words text-[#172033]">{headline.lastError ?? '—'}</dd></div>
                                <div><dt className="text-[#7c899d]">confirmation</dt><dd className="mt-1 break-words font-semibold text-[#172033]">{headline.confirmation}</dd></div>
                            </dl>
                        ) : <p className="mt-3 text-sm text-[#7c899d]">Starea apare după conectarea la LLC.</p>}
                        {headline?.activeBuffer && headline.bufferFields?.[headline.activeBuffer] && (
                            <div className="mt-5 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70">
                                <p className="ios-eyebrow">Text raportat din bufferul {headline.activeBuffer}</p>
                                <dl className="mt-3 grid gap-3 text-sm">
                                    <div><dt className="text-[#7c899d]">Kicker activ</dt><dd className="mt-1 whitespace-pre-wrap break-words font-semibold text-[#172033]">{headline.bufferFields[headline.activeBuffer]?.primary}</dd></div>
                                    <div><dt className="text-[#7c899d]">Titlu activ</dt><dd className="mt-1 whitespace-pre-wrap break-words font-semibold text-[#172033]">{headline.bufferFields[headline.activeBuffer]?.secondary}</dd></div>
                                </dl>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default TestPage;
