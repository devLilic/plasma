import {useEffect, useMemo, useState} from 'react';
import axios from 'axios';
import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import {ChevronLeftIcon, ChevronRightIcon, PencilSquareIcon, ArrowPathIcon, XMarkIcon, PlayIcon, StopIcon} from '@heroicons/react/24/outline';
import {Article, MosObject} from '@/types';
import ArticleMosContent from '@/Components/Articles/ArticleMosContent';
import {OsconConnectionStatus, OsconGroupState, OsconProfile} from '@/Components/Articles/useOsconController';
import {MosSequenceRow, orderMosSequence} from '@/Components/Articles/mosSequence';

interface MosOverrideResponse {data: MosObject}
interface MosOrphan {id: number; fieldName: string; value: string; createdAt: string}
interface SavedMosObject {object: MosObject; baseRevision?: string}
interface MosWorkspaceProps {
    article: Article | null
    previousDisabled?: boolean
    nextDisabled?: boolean
    onPrevious?: () => void
    onNext?: () => void
    live: boolean
    showOsconControls?: boolean
    profiles?: OsconProfile[]
    groups?: OsconGroupState[]
    osconStatus?: OsconConnectionStatus
    commandBusy?: boolean
    onPlay?: (article: Article, object: MosObject, profile: OsconProfile, params: Record<string, string>) => Promise<void>
    onStop?: (template: string, scope: 'profile' | 'group') => Promise<void>
}

const keyFor = (object: MosObject) => object.objectKey || object.commandId;
const titleFor = (article: Article) => article.subtitle || article.title || article.technical_title;

export function MosWorkspace({article, previousDisabled = true, nextDisabled = true, onPrevious, onNext, live, showOsconControls = true, profiles = [], groups = [], osconStatus = 'unchecked', commandBusy = false, onPlay, onStop}: MosWorkspaceProps) {
    const [saved, setSaved] = useState<Record<string, SavedMosObject>>({});
    const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [applyToMembers, setApplyToMembers] = useState<Record<string, boolean>>({});
    const [selectedProfiles, setSelectedProfiles] = useState<Record<string, string>>({});
    const [parameterMaps, setParameterMaps] = useState<Record<string, Record<string, string>>>({});
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [orphans, setOrphans] = useState<MosOrphan[]>([]);
    const [orphanError, setOrphanError] = useState<string | null>(null);

    useEffect(() => {
        if (!article?.playlist_id) return;
        let disposed = false;
        setOrphanError(null);
        axios.get<{data: MosOrphan[]}>(route('playlists.mos-overrides.index', {playlist: article.playlist_id}), {headers: {Accept: 'application/json', 'Cache-Control': 'no-cache'}})
            .then(response => { if (!disposed) setOrphans(response.data.data || []); })
            .catch(() => { if (!disposed) setOrphanError('Corecțiile orfane nu au putut fi încărcate.'); });
        return () => { disposed = true; };
    }, [article?.playlist_id]);

    const objects = useMemo(() => (article?.mos_objects || []).map(source => {
        const key = keyFor(source);
        const cached = saved[key];
        return cached && (source.revision === cached.baseRevision || source.revision === cached.object.revision) ? cached.object : source;
    }), [article?.mos_objects, saved]);

    const sequence = useMemo(() => orderMosSequence(article?.mos_timeline || [], objects), [article?.mos_timeline, objects]);

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

    return <aside className={`ios-card mos-workspace ${live ? 'mos-workspace-live' : ''}`} aria-label="Editor MOS">
        <header className="mos-workspace-header">
            <div className="min-w-0"><p className="ios-eyebrow">{live ? 'MOS · ARTICOL INDEPENDENT' : 'MOS · ARTICOL CURENT'}</p><h2 title={`#${article.playlist_order} ${titleFor(article)}`}>#{article.playlist_order} {titleFor(article)}</h2></div>
            <nav className="mos-article-nav" aria-label="Navigare articole MOS">
                <button type="button" aria-label="Articol MOS anterior" disabled={previousDisabled} onClick={onPrevious}><ChevronLeftIcon className="h-4 w-4"/></button>
                <button type="button" aria-label="Articol MOS următor" disabled={nextDisabled} onClick={onNext}><ChevronRightIcon className="h-4 w-4"/></button>
            </nav>
        </header>
        <div className="mos-workspace-scroll">
            {sequence.length ? <ol className="mos-sequence">
                {sequence.map((row, index) => {
                    if (row.kind === 'vox') return <li className="mos-sequence-vox" key={row.key}><span>{row.count === null ? 'VOX-uri' : row.count === 1 ? '1 VOX' : `${row.count} VOX-uri`}</span>{row.snippet && <small>{row.snippet}</small>}</li>;
                    const object = row.object;
                    if (!object) return <li className="mos-sequence-missing" key={row.key}><span>Grafică MOS indisponibilă în sursă.</span>{row.snippet && <small>{row.snippet}</small>}</li>;
                    if (!object.editableObjects.some(field => field.value.trim() !== '')) return null;
                    const key = keyFor(object);
                    const draft = drafts[key] || {};
                    const dirty = object.editableObjects.some(field => field.fieldKey && Object.hasOwn(draft, field.fieldKey) && draft[field.fieldKey] !== field.value);
                    const playbackAction = object.playbackState === 'active' ? 'STOP' : object.playbackState === 'paused' ? 'RESUME' : 'PLAY';
                    const canEdit = !!object.editable && !!object.objectKey && !!object.revision && object.editableObjects.some(field => !!field.fieldKey);
                    const selectedProfileId = selectedProfiles[key] ?? String(profiles.find(profile => profile.template === object.slug)?.id ?? '');
                    const profile = profiles.find(item => String(item.id) === selectedProfileId);
                    const playbackGroup = profile ? groups.find(group => group.id === profile.group) : undefined;
                    const groupUnavailable = !playbackGroup || playbackGroup.busy || playbackGroup.state === 'UNKNOWN' || playbackGroup.state === 'NEEDS_RESYNC';
                    const profileMapKey = `${key}:${selectedProfileId}`;
                    const fieldMap = parameterMaps[profileMapKey] || {};
                    const effectiveFieldMap = profile ? Object.fromEntries(profile.params.map(name => [name, fieldMap[name] ?? object.editableObjects.find(field => field.name === name && field.fieldKey)?.fieldKey ?? ''])) : {};
                    const playParams = profile ? Object.fromEntries(profile.params.map(name => {
                        const field = object.editableObjects.find(item => item.fieldKey === effectiveFieldMap[name]);
                        return [name, field?.value ?? ''];
                    })) : {};
                    const mappedFields = profile ? profile.params.map(name => effectiveFieldMap[name]).filter(Boolean) : [];
                    const uniqueMap = new Set(mappedFields).size === mappedFields.length;
                    const invalidParams = Object.values(playParams).some(value => value.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value));
                    const playReady = !!profile && !dirty && uniqueMap && !invalidParams && profile.params.every(name => !!effectiveFieldMap[name] && object.editableObjects.some(field => field.fieldKey === effectiveFieldMap[name]));
                    return <li className="mos-sequence-mos" key={row.key}><section className="mos-override-card">
                        <div className="mos-graphic-tools" aria-label={`Opțiuni ${object.slug || 'grafică MOS'}`}>
                            <span className="mos-graphic-template-badge">{object.slug || 'Grafică MOS'}</span>
                            {canEdit && <button type="button" className="mos-edit-corrections" onClick={() => { setErrors(current => ({...current, [key]: ''})); setEditingKey(key); }} aria-label={`Editează corecțiile pentru ${object.slug || 'grafică MOS'}`}><PencilSquareIcon className="h-3.5 w-3.5"/>Editează</button>}
                        </div>
                        {(object.memberObjectKeys?.length || 0) > 1 && <small className="mos-member-count">Grafica reprezintă {object.memberObjectKeys!.length} segmente MOS identice.</small>}
                        <ArticleMosContent objects={[object]} compact action={<button type="button" className="mos-playback-icon" disabled aria-label={`${playbackAction} ${object.slug || 'grafică MOS'}`} title={playbackAction}>{playbackAction === 'STOP' ? <StopIcon className="h-4 w-4" aria-hidden="true"/> : <PlayIcon className="h-4 w-4" aria-hidden="true"/>}</button>}/>
                        {row.snippet && <p className="mos-speech-snippet">{row.snippet}</p>}
                        {showOsconControls && profiles.length > 0 && <div className="mos-profile-controls">
                            <label>Profil OSCon<select value={selectedProfileId} disabled={osconStatus !== 'connected' || commandBusy} onChange={event => setSelectedProfiles(current => ({...current, [key]: event.target.value}))}>
                                <option value="">Alege profil...</option>{profiles.map(item => <option key={item.id} value={String(item.id)}>{item.template} · {item.group}</option>)}
                            </select></label>
                            {!profile && <small className="mos-profile-guidance">Niciun profil selectat pentru „{object.slug}”. Alege un profil configurat sau adaugă-l în Setări OSCon.</small>}
                            <div className="mos-profile-buttons">
                                <button type="button" disabled={!live || osconStatus !== 'connected' || commandBusy || groupUnavailable || !playReady || !object.objectKey || !object.revision} onClick={() => profile && onPlay && void onPlay(article, object, profile, playParams)}>PLAY MOS</button>
                                {profile && <button type="button" className="mos-reset" disabled={!live || osconStatus !== 'connected' || commandBusy} onClick={() => void onStop?.(profile.template, 'profile')}>STOP profil</button>}
                                {!playReady && profile && <small>{dirty ? 'Salvează corecțiile locale înainte de PLAY.' : invalidParams ? 'Parametrii depășesc limita acceptată de OSCon.' : !uniqueMap ? 'Un câmp MOS nu poate alimenta doi parametri OSCon.' : 'Asociază parametrii în „Mapare OSCon” înainte de PLAY.'}</small>}
                                {playReady && groupUnavailable && <small>{playbackGroup?.busy ? 'Grupul OSCon este ocupat.' : 'Grupul OSCon are stare UNKNOWN/NEEDS_RESYNC; folosește STOP / RESYNC din bara de sus.'}</small>}
                            </div>
                            {profile && <details className="mos-param-map-details"><summary>Mapare parametri OSCon</summary><div className="mos-param-map">{profile.params.map(name => {
                                const defaultField = object.editableObjects.find(field => field.name === name && field.fieldKey);
                                const value = effectiveFieldMap[name] ?? defaultField?.fieldKey ?? '';
                                return <label key={name}>{name}<select value={value} disabled={osconStatus !== 'connected' || commandBusy} onChange={event => setParameterMaps(current => ({...current, [profileMapKey]: {...(current[profileMapKey] || {}), [name]: event.target.value}}))}>
                                    <option value="">Alege câmp MOS...</option>{object.editableObjects.filter(field => field.fieldKey).map((field, index) => <option key={field.fieldKey || index} value={field.fieldKey!} disabled={Object.entries(effectiveFieldMap).some(([otherName, otherKey]) => otherName !== name && otherKey === field.fieldKey)}>{field.name}</option>)}
                                </select></label>;
                            })}</div></details>}
                            {!playReady && profile && invalidParams && <small className="mos-validation-error">Parametrii trebuie să aibă maximum 2.000 de caractere și să nu conțină caractere de control.</small>}
                            {!playReady && profile && !dirty && !invalidParams && profile.params.length > 0 && !object.editableObjects.some(field => field.fieldKey) && <small className="mos-validation-error">PLAY blocat: sursa nu oferă chei MOS stabile pentru maparea sigură a parametrilor.</small>}
                        </div>}
                        {showOsconControls && profiles.length === 0 && <div className="mos-profile-controls mos-profile-empty"><p>{osconStatus === 'connected' ? 'Nu există profile OSCon configurate. Configurează template-urile MOS înainte de PLAY.' : 'Conectează OSCon pentru a citi profilele configurate.'}</p>{osconStatus === 'connected' && <a href={`${route('profile.edit')}#oscon`}>Configurează template-uri OSCon</a>}</div>}
                    </section></li>;
                })}
            </ol> : <p className="mos-no-objects">Articolul nu are valori MOS disponibile.</p>}
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
                            {[...editingObject.editableObjects].sort((left, right) => {
                                const order = {short_title: 0, title: 1, value: 2};
                                return order[left.role] - order[right.role];
                            }).map((field, index) => <label className="mos-override-field" key={field.fieldKey || `${field.name}-${index}`}>
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

