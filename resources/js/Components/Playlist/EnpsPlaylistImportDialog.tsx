import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import axios from 'axios';
import {useEffect, useMemo, useState} from 'react';
import {ArrowPathIcon, ExclamationCircleIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {router} from '@inertiajs/react';
import {ENPS_PLAYLIST_QUICK_FILTERS, filterEnpsPlaylists} from '@/Components/Playlist/enpsPlaylistSearch';

type EnpsPlaylist = {
    title: string;
    guid: string;
    path: string;
    workAt: string | null;
    existingPlaylist?: ExistingPlaylist | null;
};

type ExistingPlaylist = {id: number; title: string; url: string};
type ImportedPlaylist = {id: number; title: string; url: string};
type Props = {isOpen: boolean; onClose: () => void};

const newRequestId = () => globalThis.crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
});

const requestError = (reason: unknown, fallback: string) => {
    if (!axios.isAxiosError(reason)) return fallback;
    const response = reason.response?.data as {error?: {message?: string}; message?: string; errors?: Record<string, string[]>} | undefined;
    const validationMessage = response?.errors ? Object.values(response.errors).flat()[0] : undefined;
    const message = response?.error?.message ?? validationMessage ?? response?.message;
    if (message) return message;
    return reason.response ? `${fallback} (HTTP ${reason.response.status}).` : fallback;
};

const EnpsPlaylistImportDialog = ({isOpen, onClose}: Props) => {
    const [playlists, setPlaylists] = useState<EnpsPlaylist[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [duplicate, setDuplicate] = useState<{playlist: EnpsPlaylist; existing: ExistingPlaylist} | null>(null);
    const [selected, setSelected] = useState<EnpsPlaylist | null>(null);

    const visiblePlaylists = useMemo(() => filterEnpsPlaylists(playlists, search), [playlists, search]);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setDuplicate(null);
        setSelected(null);
        setSearch('');
        axios.post<{playlists: EnpsPlaylist[]; user?: string | null}>(route('playlists.enps.catalog'))
            .then(response => {
                if (!cancelled) setPlaylists(response.data.playlists ?? []);
            })
            .catch(reason => {
                if (!cancelled) setError(requestError(reason, 'Nu s-a putut conecta la ENPS și încărca lista de playlisturi.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {cancelled = true;};
    }, [isOpen]);

    const refreshCatalog = async () => {
        if (refreshing || importing) return;
        setRefreshing(true);
        setError(null);
        try {
            const response = await axios.post<{playlists: EnpsPlaylist[]}>(route('playlists.enps.catalog'), {refresh: true});
            setPlaylists(response.data.playlists ?? []);
            setDuplicate(null);
            setSelected(null);
        } catch (reason) {
            setError(requestError(reason, 'Nu s-a putut actualiza lista din ENPS.'));
        } finally {
            setRefreshing(false);
        }
    };

    const importPlaylist = async (playlist: EnpsPlaylist, copy = false) => {
        if (importing) return;
        setSelected(playlist);
        setImporting(true);
        setError(null);
        try {
            const response = await axios.post<{playlist: ImportedPlaylist}>(route('playlists.enps.import'), {
                guid: playlist.guid,
                path: playlist.path,
                copy,
                requestId: newRequestId(),
            });
            onClose();
            router.visit(response.data.playlist.url || route('playlists.show', response.data.playlist.id));
        } catch (reason) {
            if (axios.isAxiosError(reason) && reason.response?.status === 409) {
                const data = reason.response.data as {duplicate?: ExistingPlaylist};
                if (data.duplicate) {
                    setDuplicate({playlist, existing: data.duplicate});
                    return;
                }
            }
            setError(requestError(reason, 'Importul playlistului nu a reușit. Poți încerca din nou.'));
        } finally {
            setImporting(false);
        }
    };

    const openExisting = () => {
        if (!duplicate) return;
        const url = duplicate.existing.url || route('playlists.show', duplicate.existing.id);
        onClose();
        router.visit(url);
    };

    return (
        <Dialog open={isOpen} onClose={() => importing ? undefined : onClose()} className="relative z-50">
            <div className="fixed inset-0 bg-[#101828]/45 backdrop-blur-sm" aria-hidden="true"/>
            <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
                <div className="flex min-h-full items-center justify-center">
                    <DialogPanel className="flex max-h-[min(88vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-white/70 bg-[#f8fbff] shadow-[0_28px_90px_rgba(20,35,60,0.3)]">
                        <header className="flex items-start justify-between gap-4 border-b border-[#71809a]/10 px-5 py-4 sm:px-7">
                            <div>
                                <p className="ios-eyebrow">Import ENPS</p>
                                <DialogTitle className="mt-1 text-xl font-semibold text-[#172033]">Alege un playlist</DialogTitle>
                                <p className="mt-1 text-sm text-[#65728a]">Conectarea și citirea listei au loc doar în această fereastră.</p>
                            </div>
                            <button type="button" onClick={onClose} disabled={importing} aria-label="Închide fereastra"
                                    className="rounded-xl p-2 text-[#65728a] transition hover:bg-white disabled:opacity-40">
                                <XMarkIcon className="h-5 w-5"/>
                            </button>
                        </header>

                        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
                            {duplicate ? (
                                <div className="rounded-2xl border border-[#f0cf86] bg-[#fff8e8] p-5">
                                    <p className="text-sm font-semibold text-[#704b0a]">Acest playlist a fost deja importat</p>
                                    <p className="mt-2 text-sm text-[#765d2a]">„{duplicate.existing.title}” există deja în Plasma. Poți să-l deschizi sau să imporți încă o copie.</p>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <button type="button" onClick={openExisting} disabled={importing} className="min-h-10 rounded-xl bg-[#286ee7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e5dcc] disabled:opacity-50">Deschide existent</button>
                                        <button type="button" onClick={() => importPlaylist(duplicate.playlist, true)} disabled={importing} className="min-h-10 rounded-xl border border-[#71809a]/20 bg-white px-4 py-2 text-sm font-semibold text-[#344054] disabled:opacity-50">{importing ? 'Se importă copia…' : 'Importă o copie'}</button>
                                        <button type="button" onClick={() => {setDuplicate(null); setSelected(null); setError(null);}} disabled={importing} className="min-h-10 px-3 py-2 text-sm font-semibold text-[#65728a] disabled:opacity-50">Înapoi la listă</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Caută un playlist…" aria-label="Caută un playlist ENPS"
                                                   className="ios-search min-w-0" disabled={loading || importing}/>
                                            <div role="group" aria-label="Filtre rapide pentru playlisturi" className="flex flex-wrap gap-1.5">
                                                {ENPS_PLAYLIST_QUICK_FILTERS.map(filter => {
                                                    const isActive = search.trim().toLocaleLowerCase('ro') === filter.toLocaleLowerCase('ro');
                                                    return <button key={filter} type="button" onClick={() => setSearch(filter)} disabled={loading || importing}
                                                                   aria-pressed={isActive}
                                                                   className={`min-h-8 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${isActive ? 'border-[#286ee7]/30 bg-[#286ee7]/10 text-[#286ee7]' : 'border-[#71809a]/20 bg-white/75 text-[#53627a] hover:border-[#286ee7]/30 hover:text-[#286ee7]'}`}>
                                                        {filter}
                                                    </button>;
                                                })}
                                            </div>
                                        </div>
                                        <button type="button" onClick={refreshCatalog} disabled={loading || refreshing || importing}
                                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#71809a]/20 bg-white/75 px-4 text-sm font-semibold text-[#286ee7] disabled:cursor-wait disabled:opacity-50">
                                            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}/>{refreshing ? 'Se actualizează…' : 'Reîncarcă'}
                                        </button>
                                    </div>
                                    {loading && <p role="status" aria-live="polite" className="py-10 text-center text-sm text-[#65728a]">Se conectează la ENPS și se încarcă playlisturile…</p>}
                                    {!loading && <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#71809a]/10 bg-white/55">
                                        {visiblePlaylists.length ? <ul className="divide-y divide-[#71809a]/10">
                                            {visiblePlaylists.map((playlist, index) => <li key={`${playlist.guid}-${playlist.path}-${index}`}>
                                                <button type="button" disabled={importing} onClick={() => playlist.existingPlaylist
                                                    ? (setSelected(playlist), setDuplicate({playlist, existing: playlist.existingPlaylist as ExistingPlaylist}), setError(null))
                                                    : importPlaylist(playlist)}
                                                        className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[#286ee7]/[0.05] disabled:cursor-wait disabled:opacity-60 ${selected?.guid === playlist.guid ? 'bg-[#286ee7]/[0.07]' : ''}`}>
                                                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 flex-col justify-center gap-0.5 rounded-sm bg-[#5a9b43] p-1" aria-hidden="true"><span className="h-0.5 rounded bg-white"/><span className="h-0.5 rounded bg-white"/><span className="h-0.5 rounded bg-white"/></span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block font-semibold text-[#172033]">{playlist.title}</span>
                                                        {playlist.workAt && <span className="mt-1 block text-xs text-[#53627a]">{playlist.workAt}</span>}
                                                    </span>
                                                    {playlist.existingPlaylist && <span className="shrink-0 rounded-full bg-[#fff1cf] px-2.5 py-1 text-[11px] font-semibold text-[#855b11]">Deja importat</span>}
                                                    {importing && selected?.guid === playlist.guid && <span role="status" className="shrink-0 text-xs font-semibold text-[#286ee7]">Se importă…</span>}
                                                </button>
                                            </li>)}
                                        </ul> : <p className="px-5 py-10 text-center text-sm text-[#7c899d]">{playlists.length ? 'Nu există rezultate pentru această căutare.' : 'ENPS nu a returnat playlisturi.'}</p>}
                                    </div>}
                                </>
                            )}
                            {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-[#ff3b30]/10 px-3 py-2.5 text-sm text-[#bd2d24]"><ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0"/>{error}</p>}
                            {importing && <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-[#286ee7]/[0.07] px-3 py-2.5 text-sm text-[#344054]">Se citește conținutul din ENPS și se creează playlistul în Plasma. Fereastra va rămâne deschisă până la finalizare.</p>}
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default EnpsPlaylistImportDialog;
