import {DragEvent, useEffect, useMemo, useState} from 'react';
import axios from 'axios';
import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import {ChevronLeftIcon, ChevronRightIcon, PencilSquareIcon, ArrowPathIcon, XMarkIcon, PlayIcon} from '@heroicons/react/24/outline';
import {Article, MosObject} from '@/types';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@/Store/store';
import {articlesActions} from '@/Store/article/article.slice';
import ArticleMosContent from '@/Components/Articles/ArticleMosContent';
import type {LBPortalStatus, MosPlaybackAction, MosPlaybackState} from '@/Components/Articles/useLBPortalController';
import {MosSequenceRow, moveMosSequenceRow, orderMosSequence} from '@/Components/Articles/mosSequence';
import {compareMosFieldOrder} from '@/Components/Articles/mosFieldOrder';

interface MosOverrideResponse {data: MosObject}
interface MosOrphan {id: number; fieldName: string; value: string; createdAt: string}
interface SavedMosObject {object: MosObject; baseRevision?: string}
interface MosWorkspaceProps {
    article: Article | null
    previousArticle?: Article | null
    nextArticle?: Article | null
    previousDisabled?: boolean
    nextDisabled?: boolean
    onPrevious?: () => void
    onNext?: () => void
    live: boolean
    showLBPortalControls?: boolean
    lbPortalStatus?: LBPortalStatus
    commandBusy?: boolean
    commandMessage?: string | null
    lastPlayedObjectKey?: string | null
    playbackStates?: Record<string, MosPlaybackState>
    onPlay?: (object: MosObject, action?: MosPlaybackAction) => Promise<boolean>
}

const keyFor = (object: MosObject) => object.objectKey || object.commandId;
const titleFor = (article: Article) => article.subtitle || article.title || article.technical_title;

export async function requestMosPlay(live: boolean, object: MosObject, onPlay?: (object: MosObject, action?: MosPlaybackAction) => Promise<boolean>, onRequiresLive?: () => void, action: MosPlaybackAction = 'PLAY') {
    if (!live) {
        onRequiresLive?.();
        return false;
    }
    return onPlay ? onPlay(object, action) : false;
}

export function MosWorkspace({article, previousArticle = null, nextArticle = null, previousDisabled = true, nextDisabled = true, onPrevious, onNext, live, showLBPortalControls = true, lbPortalStatus = 'unconfigured', commandBusy = false, commandMessage, lastPlayedObjectKey, playbackStates = {}, onPlay}: MosWorkspaceProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [saved, setSaved] = useState<Record<string, SavedMosObject>>({});
    const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [applyToMembers, setApplyToMembers] = useState<Record<string, boolean>>({});
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [liveModeNoticeId, setLiveModeNoticeId] = useState(0);
    const [orphans, setOrphans] = useState<MosOrphan[]>([]);
    const [orphanError, setOrphanError] = useState<string | null>(null);
    const [sequencePreferences, setSequencePreferences] = useState<{articleId: number; entryOrder: string[]; entryZones: Record<string, 'before' | 'after'>} | null>(null);
    const [draggedEntryKey, setDraggedEntryKey] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [sequenceSaving, setSequenceSaving] = useState(false);
    const [refreshingArticleIds, setRefreshingArticleIds] = useState<number[]>([]);

    useEffect(() => {
        if (!article?.playlist_id) return;
        let disposed = false;
        setOrphanError(null);
        axios.get<{data: MosOrphan[]}>(route('playlists.mos-overrides.index', {playlist: article.playlist_id}), {headers: {Accept: 'application/json', 'Cache-Control': 'no-cache'}})
            .then(response => { if (!disposed) setOrphans(response.data.data || []); })
            .catch(() => { if (!disposed) setOrphanError('Corecțiile orfane nu au putut fi încărcate.'); });
        return () => { disposed = true; };
    }, [article?.playlist_id]);

    useEffect(() => {
        if (live) setLiveModeNoticeId(0);
    }, [live]);

    useEffect(() => {
        if (commandMessage) window.dispatchEvent(new CustomEvent('plasma:toast', {detail: {message: commandMessage}}));
    }, [commandMessage]);

    useEffect(() => {
        if (liveModeNoticeId > 0) window.dispatchEvent(new CustomEvent('plasma:toast', {detail: {message: 'Intră în modul LIVE pentru a trimite grafica.'}}));
    }, [liveModeNoticeId]);

    const objects = useMemo(() => (article?.mos_objects || []).map(source => {
        const key = keyFor(source);
        const cached = saved[key];
        return cached && (source.revision === cached.baseRevision || source.revision === cached.object.revision) ? cached.object : source;
    }), [article?.mos_objects, saved]);

    const activeSequencePreferences = sequencePreferences && sequencePreferences.articleId === article?.id
        ? sequencePreferences
        : {articleId: article?.id ?? 0, entryOrder: article?.mos_sequence_order || [], entryZones: article?.mos_sequence_zones || {}};
    const sequence = useMemo(() => orderMosSequence(article?.mos_timeline, objects, activeSequencePreferences.entryOrder, activeSequencePreferences.entryZones), [article?.mos_timeline, objects, activeSequencePreferences]);

    const persistSequence = async (rows: MosSequenceRow[]) => {
        if (!article?.playlist_id) return;
        const next = {
            articleId: article.id,
            entryOrder: rows.map(row => row.key),
            entryZones: Object.fromEntries(rows.filter(row => row.kind === 'mos' && row.manuallyPositioned).map(row => [row.key, row.zone])) as Record<string, 'before' | 'after'>,
        };
        const previous = activeSequencePreferences;
        setSequencePreferences(next);
        setSequenceSaving(true);
        try {
            const response = await axios.patch<{data: {entryOrder: string[]; entryZones: Record<string, 'before' | 'after'>}}>(
                route('playlists.mos-order.update', {playlist: article.playlist_id, article: article.id}),
                {entryOrder: next.entryOrder, entryZones: next.entryZones},
                {headers: {Accept: 'application/json'}},
            );
            setSequencePreferences({articleId: article.id, ...response.data.data});
        } catch {
            setSequencePreferences(previous.articleId ? previous : null);
            window.dispatchEvent(new CustomEvent('plasma:toast', {detail: {message: 'Ordinea elementelor MOS nu a putut fi salvată.'}}));
        } finally {
            setSequenceSaving(false);
        }
    };

    const dropEntry = (event: DragEvent, targetKey: string | null, targetZone: 'before' | 'after', afterTarget = false) => {
        event.preventDefault();
        if (!draggedEntryKey) return;
        const next = moveMosSequenceRow(sequence, draggedEntryKey, targetKey, targetZone, afterTarget);
        setDraggedEntryKey(null);
        setDropTarget(null);
        if (next.some((row, index) => row.key !== sequence[index]?.key || row.zone !== sequence[index]?.zone)) void persistSequence(next);
    };

    const dragOverRow = (event: DragEvent, row: MosSequenceRow) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
        const target = `${row.key}:${position}`;
        setDropTarget(current => current === target ? current : target);
    };

    const dragOverDivider = (event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        const target = `divider:${position}`;
        setDropTarget(current => current === target ? current : target);
    };

    const leaveDropTarget = (event: DragEvent, targetPrefix: string) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDropTarget(current => current?.startsWith(targetPrefix) ? null : current);
    };

    const renderSequenceRow = (row: MosSequenceRow) => {
        if (row.kind === 'vox') return <li className="mos-sequence-vox" key={row.key} data-sequence-key={row.key}>{row.count === null ? 'VOX-uri' : row.count === 1 ? '1 VOX' : `${row.count} VOX-uri`}{row.snippet && <small>{row.snippet}</small>}</li>;
        const object = row.object;
        if (!object) return <li className="mos-sequence-missing" key={row.key} data-sequence-key={row.key}><span>Grafică MOS indisponibilă în sursă.</span>{row.snippet && <small>{row.snippet}</small>}</li>;
        const hasTextValues = object.editableObjects.some(field => field.value.trim() !== '');
        if (/^(?:\d+[_-])?VOX(?:[_-]|$)/i.test(object.slug || '') || (!hasTextValues && !object.slug)) return null;
        const key = keyFor(object);
        const draft = drafts[key] || {};
        const dirty = object.editableObjects.some(field => field.fieldKey && Object.hasOwn(draft, field.fieldKey) && draft[field.fieldKey] !== field.value);
        const playbackState = playbackStates[key]
            ? playbackStates[key].onAir ? 'onair' : 'off'
            : !showLBPortalControls && (object.playbackState === 'active' || object.playbackState === 'paused') ? 'onair' : 'off';
        const playbackAction: MosPlaybackAction = playbackState === 'onair' ? 'RESUME' : 'PLAY';
        const isLastPlayed = lastPlayedObjectKey === key;
        const isOnAir = playbackState === 'onair';
        const canEdit = !!object.editable && !!object.objectKey && !!object.revision && object.editableObjects.some(field => !!field.fieldKey);
        const invalidParams = object.editableObjects.some(field => field.value.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(field.value));
        const playReady = !!object.slug && (playbackAction === 'RESUME' || (!dirty && !invalidParams));
        const beginMosDrag = (event: DragEvent<HTMLSpanElement>) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', row.key);
            setDraggedEntryKey(row.key);
            setDropTarget(null);
        };
        const templateLabelProps = {
            draggable: !sequenceSaving,
            onDragStart: beginMosDrag,
            onDragEnd: () => { setDraggedEntryKey(null); setDropTarget(null); },
            title: 'Trage pentru reordonare',
            'aria-label': `Trage pentru a reordona ${object.slug || 'grafică MOS'}`,
        };
        const dropBefore = dropTarget === `${row.key}:before`;
        const dropAfter = dropTarget === `${row.key}:after`;
        return <li className={`mos-sequence-mos${dropBefore ? ' mos-drop-before' : ''}${dropAfter ? ' mos-drop-after' : ''}`} key={row.key} data-sequence-key={row.key} data-zone={row.zone} onDragOver={event => dragOverRow(event, row)} onDragLeave={event => leaveDropTarget(event, `${row.key}:`)} onDrop={event => dropEntry(event, row.key, row.zone, event.clientY > event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2)}>
            {(dropBefore || dropAfter) && <span className={`mos-drop-indicator ${dropAfter ? 'mos-drop-indicator-after' : 'mos-drop-indicator-before'}`} aria-hidden="true">Plasează aici</span>}
            <section className={`mos-override-card ${isOnAir || isLastPlayed ? 'mos-override-card-on-air' : ''}`} data-last-played={isLastPlayed || undefined}>
                <div className="mos-graphic-tools" aria-label={`Opțiuni ${object.slug || 'grafică MOS'}`}>
                    {row.manuallyPositioned && <span className="mos-manually-positioned">poziționat manual</span>}
                    {canEdit && <button type="button" className="mos-edit-corrections" onClick={() => { setErrors(current => ({...current, [key]: ''})); setEditingKey(key); }} aria-label={`Editează corecțiile pentru ${object.slug || 'grafică MOS'}`}><PencilSquareIcon className="h-3.5 w-3.5"/>Editează</button>}
                </div>
                {hasTextValues
                    ? <ArticleMosContent objects={[object]} compact templateLabelProps={templateLabelProps} action={<button type="button" data-action={playbackAction} className="mos-playback-icon" disabled={(live && lbPortalStatus !== 'ready') || commandBusy || !playReady} onClick={() => requestMosPlay(live, object, onPlay, () => setLiveModeNoticeId(current => current + 1), playbackAction)} aria-label={`${playbackAction} ${object.slug || 'grafică MOS'} către LB-Portal`} title={`${playbackAction} către LB-Portal`}>{playbackAction === 'RESUME' ? <ArrowPathIcon className="h-4 w-4" aria-hidden="true"/> : <PlayIcon className="h-4 w-4" aria-hidden="true"/>}</button>}/>
                    : <div className="mos-graphic-only"><span className="mos-inline-template-label" {...templateLabelProps}>{object.slug}</span><button type="button" data-action={playbackAction} className="mos-playback-icon" disabled={(live && lbPortalStatus !== 'ready') || commandBusy || !playReady} onClick={() => requestMosPlay(live, object, onPlay, () => setLiveModeNoticeId(current => current + 1), playbackAction)} aria-label={`${playbackAction} ${object.slug} către LB-Portal`} title={`${playbackAction} către LB-Portal`}>{playbackAction === 'RESUME' ? <ArrowPathIcon className="h-4 w-4" aria-hidden="true"/> : <PlayIcon className="h-4 w-4" aria-hidden="true"/>}</button></div>}
                {row.snippet && <p className="mos-speech-snippet">{row.snippet}</p>}
                {showLBPortalControls && (lbPortalStatus === 'loading' || lbPortalStatus === 'unconfigured' || lbPortalStatus === 'error' || !playReady) && <div className="mos-profile-controls">
                    <div className="mos-profile-buttons">
                        {lbPortalStatus === 'loading' && <small>Se încarcă setările LB-Portal…</small>}
                        {lbPortalStatus === 'unconfigured' && <small>Configurează IP-ul, portul și cheia LB-Portal în <a href={`${route('profile.edit')}#lb-portal`}>Setări</a>.</small>}
                        {lbPortalStatus === 'error' && <small>Setările LB-Portal nu sunt disponibile. Reîncarcă pagina sau verifică autentificarea.</small>}
                        {!playReady && (dirty ? <small>Salvează corecțiile locale înainte de PLAY.</small> : invalidParams ? <small>Valorile trebuie să aibă maximum 2.000 de caractere și să nu conțină caractere de control.</small> : <small>Grafica nu conține un template sau câmpuri MOS.</small>)}
                    </div>
                </div>}
            </section>
        </li>;
    };

    const saveObject = async (source: MosObject) => {
        if (!article || !source.objectKey || !source.revision) return false;
        const key = keyFor(source);
        const draft = drafts[key] || {};
        const fields = source.editableObjects.flatMap(field => field.fieldKey && Object.hasOwn(draft, field.fieldKey) && draft[field.fieldKey] !== field.value
            ? [{fieldKey: field.fieldKey, value: draft[field.fieldKey]}]
            : []);
        if (!fields.length) return false;
        setBusyKey(key); setErrors(current => ({...current, [key]: ''}));
        try {
            const response = await axios.patch<MosOverrideResponse>(route('playlists.mos.update', {playlist: article.playlist_id, objectKey: source.objectKey}), {
                revision: source.revision,
                fields,
                applyToMembers: !!applyToMembers[key],
            }, {headers: {Accept: 'application/json'}});
            const updated = {...source, ...response.data.data, commandId: response.data.data.commandId || source.commandId, slug: response.data.data.slug || source.slug};
            setSaved(current => ({...current, [key]: {object: updated, baseRevision: source.revision}}));
            setDrafts(current => ({...current, [key]: {}}));
            return true;
        } catch (reason: any) {
            const status = reason.response?.status;
            setErrors(current => ({...current, [key]: status === 409
                ? 'Sursa MOS s-a schimbat. Reîncarcă playlistul înainte să salvezi corecția.'
                : reason.response?.data?.message || 'Corecția MOS nu a putut fi salvată.'}));
            return false;
        } finally { setBusyKey(null); }
    };

    const resetObject = async (source: MosObject) => {
        if (!article || !source.objectKey) return false;
        const key = keyFor(source);
        setBusyKey(key); setErrors(current => ({...current, [key]: ''}));
        try {
            const response = await axios.delete<MosOverrideResponse>(route('playlists.mos.reset', {playlist: article.playlist_id, objectKey: source.objectKey}), {
                data: {revision: source.revision, applyToMembers: !!applyToMembers[key]},
                headers: {Accept: 'application/json'},
            });
            const updated = {...source, ...response.data.data, commandId: response.data.data.commandId || source.commandId, slug: response.data.data.slug || source.slug};
            setSaved(current => ({...current, [key]: {object: updated, baseRevision: source.revision}}));
            setDrafts(current => ({...current, [key]: {}}));
            return true;
        } catch (reason: any) {
            setErrors(current => ({...current, [key]: reason.response?.data?.message || 'Corecția MOS nu a putut fi eliminată.'}));
            return false;
        } finally { setBusyKey(null); }
    };

    const removeOrphan = async (orphan: MosOrphan) => {
        if (!article) return;
        try {
            await axios.delete(route('playlists.mos-overrides.destroy', {playlist: article.playlist_id, override: orphan.id}), {headers: {Accept: 'application/json'}});
            setOrphans(current => current.filter(item => item.id !== orphan.id));
        } catch (reason: any) { setOrphanError(reason.response?.data?.message || 'Corecția orfană nu a putut fi eliminată.'); }
    };

    if (!article) return <section className="ios-card mos-workspace-empty"><p className="ios-eyebrow">MOS</p><p>Selectează un articol pentru a vedea grafica asociată.</p></section>;

    const editingObject = editingKey ? objects.find(object => keyFor(object) === editingKey) ?? null : null;
    const editingDraft = editingKey ? drafts[editingKey] || {} : {};
    const editingDirty = !!editingObject && editingObject.editableObjects.some(field => field.fieldKey && Object.hasOwn(editingDraft, field.fieldKey) && editingDraft[field.fieldKey] !== field.value);
    const closeEditor = () => {
        if (editingKey && busyKey !== editingKey) {
            setDrafts(current => ({...current, [editingKey]: {}}));
            setEditingKey(null);
        }
    };
    const refreshMos = async () => {
        if (!article?.can_refresh_mos) return;
        const refreshingId = article.id;
        setRefreshingArticleIds(current => current.includes(refreshingId) ? current : [...current, refreshingId]);
        try {
            const response = await axios.post<{data: Article}>(route('playlists.articles.refresh-mos', {playlist: article.playlist_id, article: refreshingId}), {}, {headers: {Accept: 'application/json'}});
            dispatch(articlesActions.upsertArticle(response.data.data));
            window.dispatchEvent(new CustomEvent('plasma:toast', {detail: {message: 'Grafica MOS a articolului a fost actualizată din ENPS.', type: 'success'}}));
        } catch (reason: any) {
            window.dispatchEvent(new CustomEvent('plasma:toast', {detail: {message: reason.response?.data?.message || 'Elementele MOS nu au putut fi actualizate.'}}));
        } finally { setRefreshingArticleIds(current => current.filter(id => id !== refreshingId)); }
    };

    return <aside className={`ios-card mos-workspace ${live ? 'mos-workspace-live' : ''}`} aria-label="Editor MOS">
        <header className="mos-workspace-header">
            <div className="min-w-0"><p className="ios-eyebrow">{live ? 'MOS · ARTICOL INDEPENDENT' : 'MOS · ARTICOL CURENT'}</p><h2 title={`#${article.playlist_order} ${titleFor(article)}`}>#{article.playlist_order} {titleFor(article)}</h2></div>
            <button type="button" className="mos-refresh-button" disabled={!article.can_refresh_mos || refreshingArticleIds.includes(article.id) || sequenceSaving || (!!editingKey && editingDirty)} onClick={() => void refreshMos()} title={article.can_refresh_mos ? 'Actualizează grafica MOS din ENPS pentru acest articol' : 'Disponibil numai pentru articolele provenite din ENPS'}>
                <ArrowPathIcon className={`h-4 w-4 ${refreshingArticleIds.includes(article.id) ? 'animate-spin' : ''}`} aria-hidden="true"/>{refreshingArticleIds.includes(article.id) ? 'Se actualizează MOS…' : 'Refresh MOS'}
            </button>
        </header>
        <nav className="mos-article-nav" aria-label="Navigare articole MOS">
            <button type="button" className="previous" aria-label={`Articol MOS anterior${previousArticle?.technical_title ? `: ${previousArticle.technical_title}` : ''}`} title={previousArticle?.technical_title || 'Primul articol'} disabled={previousDisabled} onClick={onPrevious}>
                <ChevronLeftIcon className="h-4 w-4" aria-hidden="true"/><span><small>PREV</small><strong>{previousArticle?.technical_title || 'Primul articol'}</strong></span>
            </button>
            <button type="button" className="next" aria-label={`Articol MOS următor${nextArticle?.technical_title ? `: ${nextArticle.technical_title}` : ''}`} title={nextArticle?.technical_title || 'Ultimul articol'} disabled={nextDisabled} onClick={onNext}>
                <span><small>NEXT</small><strong>{nextArticle?.technical_title || 'Ultimul articol'}</strong></span><ChevronRightIcon className="h-4 w-4" aria-hidden="true"/>
            </button>
        </nav>
        <div className="mos-workspace-scroll">
            {sequence.length ? <>
                <ol className="mos-sequence" aria-label="Elemente MOS ordonate automat">
                    {sequence.filter(row => row.zone === 'before').map(renderSequenceRow)}
                </ol>
                {(sequence.some(row => row.zone === 'after') || draggedEntryKey) && <div className={`mos-sequence-divider${dropTarget?.startsWith('divider:') ? ' mos-divider-drop-active' : ''}`} role="separator" aria-label="Elemente MOS fără poziție automată sau poziționate manual" onDragOver={dragOverDivider} onDragLeave={event => leaveDropTarget(event, 'divider:')} onDrop={event => dropEntry(event, null, event.clientY < event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2 ? 'before' : 'after')}>
                    <span>{dropTarget?.startsWith('divider:') ? `Plasează ${dropTarget.endsWith(':before') ? 'înainte de' : 'după'} separator` : 'Fără poziție automată / mutate manual'}</span>
                </div>}
                {sequence.some(row => row.zone === 'after') && <ol className="mos-sequence" aria-label="Elemente MOS neidentificate automat sau mutate manual">
                    {sequence.filter(row => row.zone === 'after').map(renderSequenceRow)}
                </ol>}
            </> : <p className="mos-no-objects">Articolul nu are valori MOS disponibile.</p>}
            {orphanError && <p className="mos-error" role="alert">{orphanError}</p>}
            {!!orphans.length && <details className="mos-orphans"><summary>Corecții fără grafică sursă · {orphans.length}</summary>{orphans.map(orphan => <div key={orphan.id}><span>{orphan.fieldName}: {orphan.value}</span><button type="button" onClick={() => void removeOrphan(orphan)}>Elimină</button></div>)}</details>}
        </div>
        <Dialog open={!!editingObject} onClose={closeEditor} className="relative z-[100]">
            <div className="fixed inset-0 bg-[#12203a]/45 backdrop-blur-sm" aria-hidden="true"/>
            <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
                <div className="flex min-h-full items-center justify-center">
                    {editingObject && editingKey && <DialogPanel className="mos-correction-dialog">
                        <header className="mos-correction-dialog-header">
                            <div className="min-w-0"><DialogTitle className="text-base font-bold text-[#172033]">Corecții locale</DialogTitle><p className="mt-1 truncate text-xs text-[#65728a]">{editingObject.slug || 'Grafică MOS'} · {titleFor(article)}</p></div>
                            <button type="button" onClick={closeEditor} disabled={busyKey === editingKey} className="mos-correction-dialog-close" aria-label="Închide"><XMarkIcon className="h-4 w-4"/></button>
                        </header>
                        <div className="mos-correction-dialog-body">
                            {[...editingObject.editableObjects].sort(compareMosFieldOrder).map((field, index) => <label className="mos-override-field" key={field.fieldKey || `${field.name}-${index}`}>
                                <span>{field.name}{field.isOverridden && <small>corectat local</small>}{field.sourceChanged && <small className="source-changed">sursa s-a schimbat</small>}</span>
                                {field.fieldKey ? <input type="text" value={editingDraft[field.fieldKey] ?? field.value} onChange={event => setDrafts(current => ({...current, [editingKey]: {...(current[editingKey] || {}), [field.fieldKey!]: event.target.value}}))}/> : <p className="mos-override-field-readonly">{field.value || '—'}</p>}
                                {field.sourceChanged && field.importedValue !== undefined && <small className="mos-imported-value">Import ENPS: {field.importedValue || '—'}</small>}
                            </label>)}
                            {(editingObject.memberObjectKeys?.length || 0) > 1 && <label className="mos-members-toggle"><input type="checkbox" checked={!!applyToMembers[editingKey]} onChange={event => setApplyToMembers(current => ({...current, [editingKey]: event.target.checked}))}/>Aplică la toate cele {editingObject.memberObjectKeys!.length} segmente identice</label>}
                            {errors[editingKey] && <p className="mos-error" role="alert">{errors[editingKey]}</p>}
                        </div>
                        <footer className="mos-correction-dialog-footer">
                            <button type="button" className="mos-correction-cancel" onClick={closeEditor} disabled={busyKey === editingKey}>Renunță</button>
                            {editingObject.editableObjects.some(field => field.isOverridden) && <button type="button" className="mos-correction-reset" disabled={busyKey === editingKey} onClick={() => void resetObject(editingObject).then(success => { if (success) setEditingKey(null); })}><ArrowPathIcon className="h-3.5 w-3.5"/>Resetează</button>}
                            <button type="button" className="mos-correction-save" disabled={!editingDirty || busyKey === editingKey} onClick={() => void saveObject(editingObject).then(success => { if (success) setEditingKey(null); })}><PencilSquareIcon className="h-3.5 w-3.5"/>Salvează local</button>
                        </footer>
                    </DialogPanel>}
                </div>
            </div>
        </Dialog>
    </aside>;
}

