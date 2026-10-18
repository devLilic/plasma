import {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import axios from 'axios';
import {Bars3Icon, XMarkIcon} from '@heroicons/react/24/outline';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllArticles} from '@/Store/article/article.slice';
import NewArticleDialog from '@/Components/Dialogs/NewArticleDialog';
import ConfirmDialog from '@/Components/Dialogs/ConfirmDialog';
import {useActions} from '@/Hooks/useActions';
import PlaylistArticleSidebar from '@/Components/Articles/PlaylistArticleSidebar';
import ArticleWorkspace from '@/Components/Articles/ArticleWorkspace';
import {MosWorkspace} from '@/Components/Articles/MosWorkspace';
import {defaultViewerTransform, LiveImageStage, ViewerState, ViewerTransform} from '@/Components/Articles/LiveImageStage';
import {Article} from '@/types';
import {useLBPortalController} from '@/Components/Articles/useLBPortalController';
import {enterLiveMode, leaveLiveMode, selectPlaylistArticle} from '@/Components/Articles/operatorSelection';

interface ArticlesListProps {
    playlistTitle: string
    renderLayout?: (content: ReactNode, windowModeControls: ReactNode, modeSwitch: ReactNode) => ReactNode
}
type WorkMode = 'preparation' | 'live';

const ArticlesList = ({playlistTitle, renderLayout}: ArticlesListProps) => {
    const [mode, setMode] = useState<WorkMode>('preparation');
    const [livePlaylistOpen, setLivePlaylistOpen] = useState(false);
    const [smallViewport, setSmallViewport] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
    const [selectionReady, setSelectionReady] = useState(false);
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'text' | 'image'>('image');
    const [previewId, setPreviewId] = useState<number | null>(null);
    const [mosArticleId, setMosArticleId] = useState<number | null>(null);
    const [viewer, setViewer] = useState<ViewerState | null>(null);
    const [viewerBusy, setViewerBusy] = useState(false);
    const [viewerError, setViewerError] = useState<string | null>(null);
    const [transformsByImageId, setTransformsByImageId] = useState<Record<number, ViewerTransform>>({});
    const viewerRef = useRef<ViewerState | null>(null);
    const transformTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const transformCommandQueue = useRef<Promise<void>>(Promise.resolve());
    const initialSelectionHandled = useRef(false);
    const hasEnteredLive = useRef(false);
    const selectionPlaylistId = useRef<number | null>(null);
    const livePlaylistDrawerRef = useRef<HTMLDivElement>(null);
    const livePlaylistToggleRef = useRef<HTMLButtonElement>(null);
    const {deleteArticle, unmarkForDelete, markForDelete, setCurrent, changeNewArticlePosition} = useActions();
    const lbPortal = useLBPortalController();
    const articleToDelete = useTypedSelector(state => state.articles.delete_id);
    const currentId = useTypedSelector(state => state.articles.current);
    const articles = useTypedSelector(selectAllArticles);
    const currentArticle = articles.find(article => article.id === currentId) ?? null;
    const previewArticle = articles.find(article => article.id === previewId) ?? null;
    const mosArticle = articles.find(article => article.id === mosArticleId) ?? null;
    const orderedArticles = useMemo(() => [...articles].sort((left, right) => left.playlist_order - right.playlist_order), [articles]);
    const currentIndex = currentArticle ? orderedArticles.findIndex(article => article.id === currentArticle.id) : -1;
    const previousCurrentArticle = currentIndex > 0 ? orderedArticles[currentIndex - 1] : null;
    const nextCurrentArticle = currentIndex >= 0 ? orderedArticles[currentIndex + 1] ?? null : null;
    const previewIndex = previewArticle ? orderedArticles.findIndex(article => article.id === previewArticle.id) : -1;
    const previousPreviewArticle = previewIndex > 0 ? orderedArticles[previewIndex - 1] : null;
    const nextPreviewArticle = previewIndex >= 0 ? orderedArticles[previewIndex + 1] ?? null : null;

    useEffect(() => { viewerRef.current = viewer; }, [viewer]);
    useEffect(() => () => { if (transformTimer.current) clearTimeout(transformTimer.current); }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const updateViewport = () => {
            setSmallViewport(mediaQuery.matches);
            if (!mediaQuery.matches) setLivePlaylistOpen(false);
        };
        updateViewport();
        mediaQuery.addEventListener('change', updateViewport);
        return () => mediaQuery.removeEventListener('change', updateViewport);
    }, []);

    useEffect(() => {
        if (mode !== 'live') setLivePlaylistOpen(false);
    }, [mode]);

    useEffect(() => {
        const drawer = livePlaylistDrawerRef.current;
        if (!drawer) return;
        drawer.inert = mode === 'live' && smallViewport && !livePlaylistOpen;
    }, [mode, smallViewport, livePlaylistOpen]);

    useEffect(() => {
        if (mode !== 'live' || !smallViewport || !livePlaylistOpen) return;
        const focusables = () => [
            livePlaylistToggleRef.current,
            ...Array.from(livePlaylistDrawerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []),
        ].filter((element): element is HTMLElement => Boolean(element && element.getClientRects().length));
        const focusFirstDrawerControl = () => {
            const first = focusables()[1];
            first?.focus();
        };
        const frame = window.requestAnimationFrame(focusFirstDrawerControl);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setLivePlaylistOpen(false);
                window.requestAnimationFrame(() => livePlaylistToggleRef.current?.focus());
                return;
            }
            if (event.key !== 'Tab') return;
            const items = focusables();
            const first = items[0];
            const last = items[items.length - 1];
            if (!first || !last) return;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [mode, smallViewport, livePlaylistOpen]);

    useEffect(() => {
        const ids = new Set(articles.map(article => article.id));
        const playlistId = articles[0]?.playlist_id ?? null;
        if (playlistId !== null && playlistId !== selectionPlaylistId.current) {
            selectionPlaylistId.current = playlistId;
            initialSelectionHandled.current = false;
            hasEnteredLive.current = false;
            setSelectionReady(false);
            setPreviewId(null);
            setMosArticleId(null);
        }
        if (!initialSelectionHandled.current && articles.length) {
            initialSelectionHandled.current = true;
            let persisted: {currentArticleId?: number | null; previewArticleId?: number | null; mosArticleId?: number | null; hasEnteredLive?: boolean} = {};
            try {
                const raw = sessionStorage.getItem(`plasma-operator-selection:${playlistId}`);
                if (raw) persisted = JSON.parse(raw);
            } catch { /* Storage can be unavailable in restricted browser contexts. */ }
            const initial = Object.hasOwn(persisted, 'currentArticleId')
                ? (persisted.currentArticleId && ids.has(persisted.currentArticleId) ? persisted.currentArticleId : 0)
                : ids.has(currentId) ? currentId : articles[0].id;
            if (initial !== currentId) setCurrent({id: initial});
            const preview = Object.hasOwn(persisted, 'previewArticleId')
                ? (persisted.previewArticleId && ids.has(persisted.previewArticleId) ? persisted.previewArticleId : null)
                : initial || null;
            const mos = Object.hasOwn(persisted, 'mosArticleId')
                ? (persisted.mosArticleId && ids.has(persisted.mosArticleId) ? persisted.mosArticleId : null)
                : initial || null;
            setPreviewId(preview);
            setMosArticleId(mos);
            hasEnteredLive.current = persisted.hasEnteredLive === true;
            setSelectionReady(true);
            return;
        }
        if (currentId !== 0 && !ids.has(currentId)) setCurrent({id: 0});
        if (previewId !== null && !ids.has(previewId)) setPreviewId(null);
        if (mosArticleId !== null && !ids.has(mosArticleId)) setMosArticleId(null);
    }, [articles, currentId, previewId, mosArticleId, setCurrent]);

    useEffect(() => {
        const imageIds = new Set(articles.map(article => article.image?.id).filter((id): id is number => id !== undefined));
        setTransformsByImageId(current => {
            const kept = Object.entries(current).filter(([id]) => imageIds.has(Number(id)));
            return kept.length === Object.keys(current).length ? current : Object.fromEntries(kept);
        });
    }, [articles]);

    useEffect(() => {
        const playlistId = articles[0]?.playlist_id;
        if (!selectionReady || playlistId === undefined) return;
        try {
            sessionStorage.setItem(`plasma-operator-selection:${playlistId}`, JSON.stringify({currentArticleId: currentId || null, previewArticleId: previewId, mosArticleId, hasEnteredLive: hasEnteredLive.current}));
        } catch { /* Selection persistence is best-effort and contains identifiers only. */ }
    }, [articles, currentId, previewId, mosArticleId, selectionReady]);

    useEffect(() => {
        if (mode !== 'live') return;
        let disposed = false;
        setViewerBusy(true); setViewerError(null);
        axios.get<ViewerState>(route('viewer.state'), {headers: {Accept: 'application/json', 'Cache-Control': 'no-cache'}})
            .then(response => { if (!disposed) setViewer(response.data); })
            .catch(reason => { if (!disposed) setViewerError(reason.response?.data?.error || 'Starea PlasmaViewer nu este disponibilă. Reîmprospătează manual.'); })
            .finally(() => { if (!disposed) setViewerBusy(false); });
        return () => { disposed = true; };
    }, [mode]);

    const applySelection = (next: ReturnType<typeof selectPlaylistArticle>) => {
        hasEnteredLive.current = next.hasEnteredLive;
        setMode(next.mode);
        if (next.currentArticleId !== null && next.currentArticleId !== currentId) setCurrent({id: next.currentArticleId});
        setPreviewId(next.previewArticleId);
        setMosArticleId(next.mosArticleId);
    };
    const closeLivePlaylist = () => {
        setLivePlaylistOpen(false);
        window.requestAnimationFrame(() => livePlaylistToggleRef.current?.focus());
    };
    const selectArticle = (id: number) => {
        const next = selectPlaylistArticle({mode, hasEnteredLive: hasEnteredLive.current, currentArticleId: currentId || null, previewArticleId: previewId, mosArticleId}, id);
        applySelection(next);
        if (mode === 'preparation') setActiveTab('image');
        if (mode === 'live' && smallViewport) closeLivePlaylist();
    };
    const selectPreview = (id: number) => setPreviewId(id);
    const openLiveForCurrent = () => applySelection(enterLiveMode({mode, hasEnteredLive: hasEnteredLive.current, currentArticleId: currentArticle?.id ?? null, previewArticleId: previewId, mosArticleId}));
    const openPreparation = () => applySelection(leaveLiveMode({mode, hasEnteredLive: hasEnteredLive.current, currentArticleId: currentId || null, previewArticleId: previewId, mosArticleId}));
    const openNewArticle = (position: number) => { changeNewArticlePosition(position); setIsNewArticleDialogOpen(true); };
    const requestDelete = () => {
        if (!currentArticle) return;
        markForDelete(currentArticle.id); setIsConfirmDialogOpen(true);
    };
    const confirmDelete = () => {
        if (articleToDelete) deleteArticle({id: articleToDelete});
        setIsConfirmDialogOpen(false);
    };
    const cancelDelete = () => { unmarkForDelete(); setIsConfirmDialogOpen(false); };

    const movePreview = (delta: -1 | 1) => {
        if (!previewArticle) return;
        const index = orderedArticles.findIndex(article => article.id === previewArticle.id);
        const next = orderedArticles[index + delta];
        if (next) setPreviewId(next.id);
    };
    const moveMos = (delta: -1 | 1) => {
        if (!mosArticle) return;
        const index = orderedArticles.findIndex(article => article.id === mosArticle.id);
        const next = orderedArticles[index + delta];
        if (next) setMosArticleId(next.id);
    };
    const refreshViewer = async () => {
        setViewerBusy(true); setViewerError(null);
        try { const response = await axios.get<ViewerState>(route('viewer.state'), {headers: {Accept: 'application/json', 'Cache-Control': 'no-cache'}}); setViewer(response.data); }
        catch (reason: any) { setViewerError(reason.response?.data?.error || 'Starea PlasmaViewer nu este disponibilă.'); }
        finally { setViewerBusy(false); }
    };
    const sendViewerCommand = async (type: 'show' | 'show-default' | 'hide', article?: Article, transform?: ViewerTransform) => {
        setViewerBusy(true); setViewerError(null);
        try {
            const payload = (type === 'show' || type === 'show-default') && article ? {type, article_id: article.id, transform: normalizeTransform(transform || defaultViewerTransform)} : {type};
            const response = await axios.post<ViewerState>(route('viewer.command'), payload, {headers: {Accept: 'application/json'}});
            setViewer(response.data);
        } catch (reason: any) { setViewerError(reason.response?.data?.error || `Comanda ${type} nu a putut fi confirmată. Verifică starea înainte să o retrimiți.`); }
        finally { setViewerBusy(false); }
    };
    const setViewerWindowMode = async (fullscreen: boolean) => {
        setViewerBusy(true); setViewerError(null);
        try {
            const response = await axios.post<ViewerState>(route('viewer.command'), {type: 'window', window: {fullscreen}}, {headers: {Accept: 'application/json'}});
            setViewer(response.data);
        } catch (reason: any) {
            setViewerError(reason.response?.data?.error || 'Modul ferestrei PlasmaViewer nu a putut fi schimbat.');
        } finally { setViewerBusy(false); }
    };

    const transform = previewArticle?.image
        ? transformsByImageId[previewArticle.image.id]
            ?? (viewer?.activeImage?.articleId === previewArticle.id && viewer.activeImage.imageId === previewArticle.image.id ? viewer.transform : viewer?.transformDefaults || defaultViewerTransform)
        : defaultViewerTransform;
    const setTransform = (next: ViewerTransform) => {
        if (!previewArticle?.image) return;
        const article = previewArticle;
        const normalized = normalizeTransform(next);
        setTransformsByImageId(current => ({...current, [article.image!.id]: normalized}));
        if (mode !== 'live') return;

        if (transformTimer.current) clearTimeout(transformTimer.current);
        transformTimer.current = setTimeout(() => {
            const send = async () => {
                setViewerBusy(true); setViewerError(null);
                try {
                    const active = viewerRef.current;
                    const alreadyActive = Boolean(active?.visible && active.activeImage?.articleId === article.id && active.activeImage.imageId === article.image!.id);
                    const payload = alreadyActive
                        ? {type: 'transform', transform: normalized}
                        : {type: 'show', article_id: article.id, transform: normalized};
                    const response = await axios.post<ViewerState>(route('viewer.command'), payload, {headers: {Accept: 'application/json'}});
                    viewerRef.current = response.data;
                    setViewer(response.data);
                } catch (reason: any) {
                    setViewerError(reason.response?.data?.error || 'Ajustările imaginii nu au putut fi trimise către PlasmaViewer.');
                } finally { setViewerBusy(false); }
            };
            const pending = transformCommandQueue.current.then(send, send);
            transformCommandQueue.current = pending.then(() => undefined, () => undefined);
        }, 80);
    };

    const modeSwitch = <nav className="operator-mode-switch operator-header-mode-switch" aria-label="Mod de lucru">
        <button type="button" aria-pressed={mode === 'preparation'} className={mode === 'preparation' ? 'active' : ''} onClick={openPreparation}>Pregătire</button>
        <button type="button" aria-pressed={mode === 'live'} className={mode === 'live' ? 'active live' : ''} onClick={openLiveForCurrent}>LIVE</button>
    </nav>;
    const windowFullscreen = viewer?.window?.fullscreen ?? true;
    const windowModeControls = <div className="viewer-window-mode-actions" role="group" aria-label="Mod afișare FR2">
        <button type="button" className={`viewer-window-mode-button ${windowFullscreen ? 'active' : ''}`} aria-label="Afișează FR2 pe tot ecranul" title={viewerError || 'Fullscreen FR2'} aria-pressed={windowFullscreen} disabled={viewerBusy} onClick={() => void setViewerWindowMode(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/></svg>
        </button>
        <button type="button" className={`viewer-window-mode-button ${!windowFullscreen ? 'active' : ''}`} aria-label="Afișează FR2 în fereastră" title={viewerError || 'Windowed FR2'} aria-pressed={!windowFullscreen} disabled={viewerBusy} onClick={() => void setViewerWindowMode(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>
        </button>
    </div>;
    const livePlaylistToggle = mode === 'live' && <button
            ref={livePlaylistToggleRef}
            type="button"
            className="live-playlist-toggle"
            aria-label={livePlaylistOpen ? 'Închide playlistul LIVE' : 'Deschide playlistul LIVE'}
            aria-expanded={livePlaylistOpen}
            aria-controls="live-playlist-drawer"
            onClick={() => setLivePlaylistOpen(open => !open)}
        >{livePlaylistOpen ? <XMarkIcon className="h-5 w-5"/> : <Bars3Icon className="h-5 w-5"/>}</button>;
    const content = <div className="playlist-operator">
        {mode === 'live' && livePlaylistOpen && <div className="live-playlist-backdrop" aria-hidden="true" onClick={closeLivePlaylist}/>}
        <div className={`playlist-operator-grid ${mode === 'live' ? 'live-mode' : 'preparation-mode'}`}>
            <div
                ref={livePlaylistDrawerRef}
                id="live-playlist-drawer"
                className={`live-playlist-drawer${livePlaylistOpen ? ' is-open' : ''}`}
                role={mode === 'live' && smallViewport ? 'dialog' : undefined}
                aria-label={mode === 'live' && smallViewport ? 'Playlist LIVE' : undefined}
                aria-modal={mode === 'live' && smallViewport ? true : undefined}
                aria-hidden={mode === 'live' && smallViewport ? !livePlaylistOpen : undefined}
            >
                <PlaylistArticleSidebar playlistTitle={playlistTitle} articles={articles} currentId={currentArticle?.id ?? 0} previewId={previewId} mosArticleId={mosArticleId} viewerActiveArticleId={viewer?.visible ? viewer.activeImage?.articleId ?? null : null} live={mode === 'live'} onSelect={selectArticle} onSelectMos={setMosArticleId} onPreview={selectPreview} onAddFirst={() => openNewArticle(orderedArticles[0]?.playlist_order ?? 1)} onAddAfter={article => openNewArticle(article.playlist_order + 1)}/>
            </div>
            <main className="playlist-operator-center">
                {!articles.length ? <div className="ios-card empty-playlist-operator"><p className="text-lg font-bold text-[#172033]">Playlistul nu conține materiale</p><p>Folosește butonul + din playlist pentru a adăuga primul material.</p></div> : mode === 'preparation'
                    ? currentArticle
                        ? <ArticleWorkspace article={currentArticle} activeTab={activeTab} onTabChange={setActiveTab} onOpenOnAir={openLiveForCurrent} onDelete={requestDelete} showMos={false} operatorMode previousArticle={previousCurrentArticle} nextArticle={nextCurrentArticle} onPreviousArticle={() => { if (previousCurrentArticle) selectArticle(previousCurrentArticle.id); }} onNextArticle={() => { if (nextCurrentArticle) selectArticle(nextCurrentArticle.id); }}/>
                        : <EmptyOperatorPanel title="Niciun articol selectat" body="Alege o știre din playlist. Selecția nu va fi schimbată automat." />
                    : <LiveImageStage article={previewArticle} playlistToggle={livePlaylistToggle} previousArticle={previousPreviewArticle} nextArticle={nextPreviewArticle} previousDisabled={!previousPreviewArticle} nextDisabled={!nextPreviewArticle} onPrevious={() => movePreview(-1)} onNext={() => movePreview(1)} viewer={viewer} viewerBusy={viewerBusy} viewerError={viewerError} onRefreshViewer={() => void refreshViewer()} onShow={(article, draft) => { if (transformTimer.current) clearTimeout(transformTimer.current); void sendViewerCommand('show', article, draft); }} onShowDefault={(article, draft) => { if (transformTimer.current) clearTimeout(transformTimer.current); void sendViewerCommand('show-default', article, draft); }} onHide={() => { if (transformTimer.current) clearTimeout(transformTimer.current); void sendViewerCommand('hide'); }} transform={transform} onTransformChange={setTransform}/>}
            </main>
            <MosWorkspace article={mosArticle} previousDisabled={!mosArticle || orderedArticles.findIndex(item => item.id === mosArticle.id) <= 0} nextDisabled={!mosArticle || orderedArticles.findIndex(item => item.id === mosArticle.id) >= orderedArticles.length - 1} onPrevious={() => moveMos(-1)} onNext={() => moveMos(1)} live={mode === 'live'} showLBPortalControls lbPortalStatus={lbPortal.status} commandBusy={lbPortal.busy} commandMessage={lbPortal.message} lastPlayedObjectKey={lbPortal.lastPlayedObjectKey} playbackStates={lbPortal.playbackStates} onPlay={lbPortal.sendPlay}/>
        </div>

        <NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={() => setIsNewArticleDialogOpen(open => !open)}/>
        <ConfirmDialog isOpen={isConfirmDialogOpen} handleDialog={() => setIsConfirmDialogOpen(open => !open)} confirmAction={confirmDelete} cancelAction={cancelDelete}/>
    </div>;
    return renderLayout ? renderLayout(content, windowModeControls, modeSwitch) : <>{windowModeControls}{modeSwitch}{content}</>;
};

function EmptyOperatorPanel({title, body}: {title: string; body: string}) {
    return <section className="ios-card empty-operator-panel"><h2>{title}</h2><p>{body}</p></section>;
}

function normalizeTransform(value: ViewerTransform): ViewerTransform {
    const zoom = Math.min(4, Math.max(1, value.zoom));
    const maxPan = (zoom - 1) * 50;
    return {...value, zoom, panX: Math.min(maxPan, Math.max(-maxPan, value.panX)), panY: Math.min(maxPan, Math.max(-maxPan, value.panY))};
}

export default ArticlesList;
