import {useRef, useState} from 'react';
import axios from 'axios';
import {Head} from '@inertiajs/react';
import {CheckCircleIcon, ExclamationCircleIcon, SignalIcon, StopIcon} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {PageProps} from '@/types';

type Connection = {
    user: string | null;
    homeDatabase: string | null;
    homeProgram: string | null;
    globalTables: Record<string, number>;
    playlists: Array<{title: string; guid: string | null; path: string | null; uri?: string | null; workAt: string | null; modifiedAt: string | null}>;
    serviceAddress: string;
    verifiedAt: string;
};

type Configuration = {
    url: string;
    domain: string;
    timezone: string;
    timeout: number;
    configured: boolean;
};

type Props = PageProps & {configuration: Configuration; connection: Connection | null};
type PlaylistStory = {name: string; status: string | null; segments?: string[]; scriptOrder?: number; pageNum?: string | null; frontTime?: string | null};

const storyStatusStyle: Record<string, string> = {
    INTRO: 'bg-[#0a84ff]/10 text-[#0874d1]',
    INTO: 'bg-[#0a84ff]/10 text-[#0874d1]',
    OFF: 'bg-[#ff9500]/12 text-[#c66b00]',
    BETA: 'bg-[#5856d6]/10 text-[#5856d6]',
    LIVE: 'bg-[#ff3b30]/10 text-[#d62f28]',
    SNC: 'bg-[#34a853]/12 text-[#27863f]',
};

const TestPage = ({auth, configuration, connection: initialConnection}: Props) => {
    const [connection, setConnection] = useState(initialConnection);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Connection['playlists'][number] | null>(null);
    const [playlistStories, setPlaylistStories] = useState<PlaylistStory[] | null>(null);
    const [playlistError, setPlaylistError] = useState<string | null>(null);
    const [loadingPlaylist, setLoadingPlaylist] = useState(false);
    const contentRequestId = useRef(0);
    const [message, setMessage] = useState(initialConnection ? 'Conexiunea ENPS este activă.' : 'Conectează-te la ENPS pentru a verifica handshake-ul.');

    const action = async (kind: 'connect' | 'ping' | 'disconnect' | 'refresh-playlists') => {
        if (busy) return;
        setBusy(true);
        setError(null);
        setMessage(kind === 'connect' ? 'Se verifică serviciul și se inițializează conexiunea ENPS…'
            : kind === 'ping' ? 'Se verifică sesiunea ENPS…'
                : kind === 'disconnect' ? 'Se închide sesiunea ENPS…' : 'Se reîncarcă lista de playlisturi ENPS…');
        try {
            const response = await axios.post<{connection: Connection | null; message?: string; error?: {message: string}}>(route(`enps.${kind}`));
            setConnection(response.data.connection);
            if (['disconnect', 'connect', 'refresh-playlists'].includes(kind)) {
                setSelectedPlaylist(null);
                setPlaylistStories(null);
                setPlaylistError(null);
            }
            setMessage(response.data.message ?? (kind === 'disconnect' ? 'Sesiunea ENPS a fost închisă.'
                : kind === 'refresh-playlists' ? 'Lista a fost actualizată din ENPS.' : 'Conexiunea și sesiunea ENPS au fost verificate.'));
        } catch (reason) {
            const response = axios.isAxiosError(reason) ? reason.response?.data as {error?: {message?: string}; connection?: Connection | null} | undefined : undefined;
            if (response && 'connection' in response) setConnection(response.connection ?? null);
            const text = response?.error?.message ?? 'Solicitarea către ENPS nu a reușit. Verifică rețeaua și configurația locală.';
            setError(text);
            setMessage(text);
        } finally {
            setBusy(false);
        }
    };

    const selectPlaylist = async (playlist: Connection['playlists'][number]) => {
        setSelectedPlaylist(playlist);
        setPlaylistStories(null);
        setPlaylistError(null);
        if (!playlist.guid || !playlist.path) {
            setPlaylistError('ENPS nu a returnat identificatorul playlistului.');
            return;
        }

        const requestId = ++contentRequestId.current;
        setLoadingPlaylist(true);
        try {
            const response = await axios.post<{stories: PlaylistStory[]}>(route('enps.playlist-content'), {
                guid: playlist.guid,
                path: playlist.path,
            });
            if (requestId === contentRequestId.current) setPlaylistStories(response.data.stories);
        } catch (reason) {
            const response = axios.isAxiosError(reason) ? reason.response?.data as {error?: {message?: string}} | undefined : undefined;
            if (requestId === contentRequestId.current) setPlaylistError(response?.error?.message ?? 'Nu s-a putut încărca acest playlist.');
        } finally {
            if (requestId === contentRequestId.current) setLoadingPlaylist(false);
        }
    };

    const steps = [
        {label: 'Serviciu ENPS disponibil', done: !!connection},
        {label: 'Autentificare reușită', done: !!connection},
        {label: 'Ping și GlobalTables verificate', done: !!connection},
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Test ENPS Web"/>
            <div className="ios-page">
                <header className="ios-page-header mx-auto max-w-6xl">
                    <div>
                        <p className="ios-eyebrow">Test de integrare</p>
                        <h1 className="ios-title">Conexiune ENPS Web</h1>
                        <p className="ios-subtitle">Verifică logarea, sesiunea și răspunsul inițial al serviciului ENPS.</p>
                    </div>
                </header>
                <div className="mx-auto grid max-w-6xl gap-5">
                    <section className="ios-card p-5 sm:p-8">
                        <p className="ios-eyebrow">Configurație locală</p>
                        <h2 className="ios-section-title">Acces din fișierul .env</h2>
                        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                            <div><dt className="text-[#7c899d]">Adresă ENPS Web</dt><dd className="mt-1 break-all font-medium text-[#172033]">{configuration.url}</dd></div>
                            <div><dt className="text-[#7c899d]">Domeniu (opțional)</dt><dd className="mt-1 font-medium text-[#172033]">{configuration.domain || 'Implicit, conform ENPS Web'}</dd></div>
                            <div><dt className="text-[#7c899d]">Fus orar pentru cheia de logare</dt><dd className="mt-1 font-medium text-[#172033]">{configuration.timezone}</dd></div>
                            <div><dt className="text-[#7c899d]">Timeout</dt><dd className="mt-1 font-medium text-[#172033]">{configuration.timeout} secunde</dd></div>
                        </dl>
                        {!configuration.configured && (
                            <p className="mt-5 rounded-2xl bg-[#fff7e6] px-4 py-3 text-sm leading-6 text-[#855b11]">
                                Completează ENPS_WEB_USERNAME și ENPS_WEB_PASSWORD în fișierul .env, apoi reîncarcă această pagină. ENPS_WEB_DOMAIN poate rămâne gol.
                            </p>
                        )}
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button type="button" onClick={() => action('connect')} disabled={busy || !configuration.configured}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#286ee7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e5dcc] disabled:cursor-wait disabled:opacity-60">
                                <SignalIcon className="h-5 w-5"/>{busy ? 'Se procesează…' : 'Conectează și verifică'}
                            </button>
                            <button type="button" onClick={() => action('ping')} disabled={busy || !connection}
                                    className="min-h-11 rounded-2xl border border-[#71809a]/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#286ee7] disabled:opacity-45">
                                Verifică sesiunea
                            </button>
                            <button type="button" onClick={() => action('disconnect')} disabled={busy || !connection}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#71809a]/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#65728a] disabled:opacity-45">
                                <StopIcon className="h-4 w-4"/>Deconectează
                            </button>
                        </div>
                        <p role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'} className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm leading-6 ${error ? 'bg-[#ff3b30]/10 text-[#bd2d24]' : 'bg-white/45 text-[#53627a]'}`}>
                            {error && <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0"/>}{message}
                        </p>
                    </section>

                    <section className="ios-card p-5 sm:p-7">
                        <h2 className="ios-section-title">Handshake</h2>
                        <ol className="mt-4 grid gap-3">
                            {steps.map(step => <li key={step.label} className="flex items-center gap-3 text-sm">
                                {step.done ? <CheckCircleIcon className="h-5 w-5 text-[#238a45]"/> : <span className="h-5 w-5 rounded-full border-2 border-[#aab4c4]"/>}
                                <span className={step.done ? 'font-semibold text-[#172033]' : 'text-[#65728a]'}>{step.label}</span>
                            </li>)}
                        </ol>
                    </section>

                    {connection && (
                        <section className="ios-card p-5 sm:p-7">
                            <h2 className="ios-section-title">Răspuns ENPS</h2>
                            <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                                <div><dt className="text-[#7c899d]">Utilizator confirmat</dt><dd className="mt-1 font-semibold text-[#172033]">{connection.user ?? 'ENPS nu a returnat numele utilizatorului'}</dd></div>
                                <div><dt className="text-[#7c899d]">Baza de date principală</dt><dd className="mt-1 font-semibold text-[#172033]">{connection.homeDatabase ?? 'ENPS nu a returnat baza principală'}</dd></div>
                                <div><dt className="text-[#7c899d]">Ultima verificare</dt><dd className="mt-1 font-medium text-[#172033]">{new Date(connection.verifiedAt).toLocaleString('ro-RO', {timeZone: configuration.timezone})}</dd></div>
                                <div><dt className="text-[#7c899d]">Endpoint JSON</dt><dd className="mt-1 break-all font-mono text-xs text-[#172033]">{connection.serviceAddress}</dd></div>
                            </dl>
                            <div className="mt-5 border-t border-[#71809a]/10 pt-4">
                                <h3 className="text-sm font-semibold text-[#172033]">Rezumat GlobalTables</h3>
                                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {Object.entries(connection.globalTables).map(([name, count]) => <div key={name} className="flex justify-between gap-4 rounded-xl bg-white/45 px-3 py-2 text-sm">
                                        <dt className="break-all text-[#53627a]">{name}</dt><dd className="shrink-0 font-semibold text-[#172033]">{count}</dd>
                                    </div>)}
                                    {Object.keys(connection.globalTables).length === 0 && <p className="text-sm text-[#7c899d]">Răspunsul GlobalTables este gol.</p>}
                                </dl>
                            </div>
                        </section>
                    )}

                    {connection && (
                        <section className="ios-card overflow-hidden">
                            <div className="ios-card-header flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div><p className="ios-eyebrow">{connection.homeProgram ? `P_${connection.homeProgram}\\W` : 'Home Program'}</p><h2 className="ios-section-title">Playlisturi ENPS</h2></div>
                                <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-[#65728a]">{connection.playlists.length} playlisturi</span>
                                    <button type="button" onClick={() => action('refresh-playlists')} disabled={busy}
                                            className="rounded-xl border border-[#71809a]/20 bg-white/70 px-3 py-2 text-xs font-semibold text-[#286ee7] disabled:cursor-wait disabled:opacity-50">
                                        {busy ? 'Se actualizează…' : 'Reîncarcă lista'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid min-h-[32rem] lg:grid-cols-2">
                                <div className="min-w-0 border-b border-[#71809a]/10 lg:border-b-0 lg:border-r">
                                    <div className="max-h-[42rem] overflow-y-auto">
                                        {connection.playlists.length > 0 ? (
                                            <ul className="divide-y divide-[#71809a]/10 px-4 sm:px-6">
                                                {connection.playlists.map((playlist, index) => {
                                                    const selected = selectedPlaylist?.guid === playlist.guid && selectedPlaylist?.path === playlist.path;
                                                    return <li key={playlist.guid ?? playlist.path ?? `${playlist.title}-${index}`}>
                                                        <button type="button" onClick={() => selectPlaylist(playlist)} disabled={loadingPlaylist}
                                                                aria-pressed={selected}
                                                                className={`flex w-full items-start gap-3 py-4 text-left transition ${selected ? 'rounded-xl bg-[#286ee7]/[0.08] px-3' : 'hover:bg-white/40'} disabled:cursor-wait`}>
                                                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 flex-col justify-center gap-0.5 rounded-sm bg-[#5a9b43] p-1" aria-hidden="true">
                                                                <span className="h-0.5 rounded bg-white"/><span className="h-0.5 rounded bg-white"/><span className="h-0.5 rounded bg-white"/>
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block font-semibold text-[#172033]">{playlist.title}</span>
                                                                {playlist.workAt && <span className="mt-1 block text-xs text-[#53627a]">{playlist.workAt}</span>}
                                                            </span>
                                                        </button>
                                                    </li>;
                                                })}
                                            </ul>
                                        ) : <p className="px-5 pb-6 text-sm text-[#7c899d] sm:px-7">Primul răspuns Lists nu conține playlisturi accesibile.</p>}
                                    </div>
                                </div>
                                <div className="min-w-0 p-5 sm:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="min-w-0 text-base font-semibold text-[#172033]">{selectedPlaylist?.title ?? 'Stories din playlist'}</h3>
                                        {playlistStories && <span className="shrink-0 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-[#65728a]">{playlistStories.length} stories</span>}
                                    </div>
                                    {!selectedPlaylist && <p className="mt-3 text-sm text-[#7c899d]">Selectează un playlist din listă pentru a-i încărca conținutul.</p>}
                                    {loadingPlaylist && <p role="status" className="mt-3 text-sm text-[#53627a]">Se încarcă conținutul playlistului…</p>}
                                    {playlistError && <p role="alert" className="mt-3 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#bd2d24]">{playlistError}</p>}
                                    {playlistStories && playlistStories.length > 0 && <ol className="mt-4 max-h-[38rem] divide-y divide-[#71809a]/10 overflow-y-auto rounded-xl border border-[#71809a]/10 bg-white/45">
                                        {playlistStories.map((story, index) => <li key={`${story.name}-${index}`} className="flex items-start gap-3 px-4 py-3">
                                            <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-[#9aa5b5]">{index + 1}.</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block break-words text-sm font-medium leading-5 text-[#172033]">{story.name}</span>
                                                {(story.segments?.length ? story.segments : story.status ? [story.status] : []).length > 0 && <span className="mt-2 flex flex-wrap gap-1.5">
                                                    {(story.segments?.length ? story.segments : story.status ? [story.status] : []).map((segment, segmentIndex) => <span key={`${segment}-${segmentIndex}`} className={`rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-[0.06em] ${storyStatusStyle[segment] ?? 'bg-[#71809a]/10 text-[#65728a]'}`}>
                                                        {segment}
                                                    </span>)}
                                                </span>}
                                            </span>
                                        </li>)}
                                    </ol>}
                                    {playlistStories && playlistStories.length === 0 && <p className="mt-4 rounded-xl bg-white/45 px-4 py-3 text-sm text-[#7c899d]">ENPS nu a returnat stories pentru acest playlist.</p>}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default TestPage;
