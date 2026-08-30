import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import axios from 'axios';
import {PhotoIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import {createPortal} from 'react-dom';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface ViewerTransform {brightness: number; contrast: number; saturation: number; zoom: number; panX: number; panY: number; flipX: boolean}
interface ViewerState {visible: boolean; activeImage: {articleId: number; title: string; url: string} | null; transform: ViewerTransform; transformDefaults?: ViewerTransform; error: string | null}
const defaults: ViewerTransform = {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false};

interface OnAirDialogProps {
    articles: Article[]
    startArticleId: number | null
    isOpen: boolean
    onClose: () => void
}

const OnAirDialog = ({articles, startArticleId, isOpen, onClose}: OnAirDialogProps) => {
    const orderedArticles = useMemo(() => [...articles].sort((left, right) => left.playlist_order - right.playlist_order), [articles]);
    const [cursorId, setCursorId] = useState<number | null>(startArticleId);
    const [transform, setTransform] = useState(defaults);
    const [viewer, setViewer] = useState<ViewerState | null>(null);
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [previewSize, setPreviewSize] = useState({width: 0, height: 0});
    const currentIndex = orderedArticles.findIndex(article => article.id === cursorId);
    const article = currentIndex >= 0 ? orderedArticles[currentIndex] : null;
    const previousArticle = currentIndex > 0 ? orderedArticles[currentIndex - 1] : null;
    const nextArticle = currentIndex >= 0 && currentIndex < orderedArticles.length - 1 ? orderedArticles[currentIndex + 1] : null;
    const activeOnAirArticle = viewer?.activeImage
        ? orderedArticles.find(item => item.id === viewer.activeImage?.articleId) ?? null
        : null;

    useLayoutEffect(() => {
        const preview = previewRef.current;
        if (!preview) return;
        const syncSize = () => setPreviewSize({width: preview.clientWidth, height: preview.clientHeight});
        syncSize();
        const observer = new ResizeObserver(syncSize);
        observer.observe(preview);
        return () => observer.disconnect();
    }, [isOpen, cursorId]);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setCursorId(startArticleId);
        setSent(false);
        setError(null);

        const loadInitialState = async () => {
            try {
                const {data} = await axios.get<ViewerState>(route('viewer.state'));
                if (cancelled) return;
                setViewer(data);
                setTransform(viewerDefaults(data));
            } catch (reason: any) {
                if (!cancelled) setError(reason.response?.data?.error ?? 'PlasmaViewer nu este disponibil.');
            }
        };

        void loadInitialState();
        const timer = window.setInterval(() => void loadState(), 2000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [isOpen, startArticleId]);

    useEffect(() => {
        if (!isOpen || !sent || !article?.image) return;
        const timer = window.setTimeout(() => void command('transform', {transform}, false), 100);
        return () => window.clearTimeout(timer);
    }, [transform, sent, isOpen, article?.id]);

    const loadState = async () => {
        try {
            const {data} = await axios.get<ViewerState>(route('viewer.state'));
            setViewer(data);
            setError(null);
        } catch (reason: any) {
            setError(reason.response?.data?.error ?? 'PlasmaViewer nu este disponibil.');
        }
    };

    const command = async (type: string, extra: Record<string, unknown> = {}, showBusy = true) => {
        if (showBusy) setBusy(true);
        try {
            const {data} = await axios.post<ViewerState>(route('viewer.command'), {type, ...extra});
            setViewer(data);
            setError(null);
            return true;
        } catch (reason: any) {
            setError(reason.response?.data?.error ?? 'Comanda nu a putut fi trimisă.');
            return false;
        } finally {
            if (showBusy) setBusy(false);
        }
    };

    const show = async () => {
        if (!article?.image) return;
        if (await command('show', {article_id: article.id, transform: normalizeTransform(transform)})) setSent(true);
    };

    const hide = async () => {
        if (await command('hide')) setSent(false);
    };

    const reset = async () => {
        const nextTransform = viewer ? viewerDefaults(viewer) : {...defaults};
        setTransform(nextTransform);
        if (sent) await command('reset-transform', {}, false);
    };

    const selectPreview = (articleId: number) => {
        if (!orderedArticles.some(item => item.id === articleId)) return;
        setCursorId(articleId);
        setSent(false);
        setTransform(viewer ? viewerDefaults(viewer) : {...defaults});
        setError(null);
    };

    if (!isOpen || !article) return null;
    const normalizedTransform = normalizeTransform(transform);
    const maxPan = maxPanForZoom(normalizedTransform.zoom);
    const previewTransformStyle = {transform: `translate(${previewSize.width * normalizedTransform.panX / 100}px, ${previewSize.height * normalizedTransform.panY / 100}px) scale(${normalizedTransform.zoom})`};
    const imageStyle = {filter: `brightness(${normalizedTransform.brightness}%) contrast(${normalizedTransform.contrast}%) saturate(${normalizedTransform.saturation}%)`, transform: `scaleX(${normalizedTransform.flipX ? -1 : 1})`};

    return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#12203a]/45 p-2 backdrop-blur-md sm:p-3" role="dialog" aria-modal="true" aria-label="Control onAIR">
        <div className="liquid-dialog max-h-[98vh] w-full max-w-5xl overflow-auto rounded-[26px] border border-white/75 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_30px_100px_rgba(15,29,62,0.34)] backdrop-blur-[32px]">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#71809a]/10 bg-white/35 px-4 py-3 backdrop-blur-2xl sm:px-5">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e13d37]">onAIR · #{article.playlist_order}</p><h2 className="truncate text-lg font-bold tracking-[-0.02em] text-[#172033]">{article.technical_title || article.title || article.subtitle}</h2></div>
                <div className="flex shrink-0 items-center gap-2">
                    <button type="button" disabled={busy} onClick={() => void command('disconnect-outputs')} className="inline-flex min-h-9 items-center rounded-full bg-[#ff3b30] px-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#e52f26] disabled:opacity-50 sm:px-3" aria-label="Deconectează ferestrele FR2 și FR3" title="Deconectează FR2 și FR3"><span className="sm:hidden">FR2/3</span><span className="hidden sm:inline">Deconectează</span></button>
                    <span className="min-w-12 rounded-full border border-white/70 bg-white/50 px-2 py-2 text-center text-xs font-semibold tabular-nums text-[#65728a]" aria-label={`Poziția ${currentIndex + 1} din ${orderedArticles.length}`}>{currentIndex + 1}/{orderedArticles.length}</span>
                    <button type="button" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/50 text-[#65728a] shadow-sm hover:bg-white/85" onClick={onClose}><XMarkIcon className="h-5 w-5"/></button>
                </div>
            </header>
            <div className={`grid gap-3 p-3 sm:p-4 ${article.image ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : ''}`}>
                <section>
                    {article.image ? (
                        <div ref={previewRef} className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-inner">
                            <div className="absolute inset-0 origin-center" style={previewTransformStyle}><ImageWithLoader src={article.image.url} alt="Preview onAIR" containerClassName="block h-full w-full" className="absolute inset-0 block h-full w-full origin-center object-cover" style={imageStyle}/></div>
                            <button type="button" disabled={busy} onClick={show} className="absolute bottom-3 left-1/2 z-[2] min-h-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#ff3b30] px-5 font-semibold text-white shadow-[0_8px_24px_rgba(100,20,20,.35)] transition hover:bg-[#e52f26] disabled:opacity-50">{busy ? 'Se trimite…' : 'Afișează onAIR'}</button>
                        </div>
                    ) : (
                        <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-[#9aa8bc]/40 bg-white/30 px-6 text-center shadow-inner">
                            <PhotoIcon className="mb-3 h-12 w-12 text-[#9aa8bc]"/>
                            <p className="font-semibold text-[#172033]">Material fără imagine</p>
                            <p className="mt-1 max-w-md text-sm leading-6 text-[#65728a]">Folosește „Ascunde” pentru a elimina imaginea onAIR și a lăsa vizibilă imaginea implicită din PlasmaViewer.</p>
                        </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Navigare între materialele playlistului">
                        <PlaylistNavigationButton article={previousArticle} direction="prev" onSelect={selectPreview}/>
                        <PlaylistNavigationButton article={nextArticle} direction="next" onSelect={selectPreview}/>
                    </div>
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-white/75 bg-white/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        {activeOnAirArticle && viewer?.activeImage ? (
                            <button type="button" onClick={() => selectPreview(activeOnAirArticle.id)} className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left" title="Revino la imaginea onAIR activă">
                                <ImageWithLoader src={viewer.activeImage.url} alt="Imagine onAIR activă" containerClassName="h-12 w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#e9edf5]" className="h-full w-full object-cover"/>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold text-[#65728a]">Imagine onAIR activă</span>
                                    <span className="mt-0.5 block truncate text-sm font-semibold text-[#172033] transition group-hover:text-[#286ee7]" title={activeOnAirArticle.technical_title || activeOnAirArticle.subtitle}>{activeOnAirArticle.technical_title || activeOnAirArticle.subtitle}</span>
                                </span>
                            </button>
                        ) : (
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#65728a]">Imagine implicită</p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-[#172033]" title={article.technical_title || article.subtitle}>{article.technical_title || article.subtitle}</p>
                            </div>
                        )}
                        <button type="button" disabled={busy} onClick={() => void hide()} className="ios-secondary-button shrink-0">Ascunde</button>
                    </div>
                    {error && <p className="mt-3 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-sm font-medium text-[#c9251c]">{error}</p>}
                </section>
                {article.image && <aside className="rounded-[20px] border border-white/75 bg-white/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] sm:p-4">
                    <h3 className="mb-2 font-bold text-[#172033]">Ajustări imagine</h3>
                    <div className="grid grid-cols-2 gap-x-4 lg:grid-cols-1 lg:gap-y-2.5">
                        <div className="space-y-2">
                            <Slider label="Luminozitate" value={transform.brightness} min={0} max={200} suffix="%" change={brightness => setTransform(current => ({...current, brightness}))}/>
                            <Slider label="Contrast" value={transform.contrast} min={0} max={200} suffix="%" change={contrast => setTransform(current => ({...current, contrast}))}/>
                            <Slider label="Saturație" value={transform.saturation} min={0} max={200} suffix="%" change={saturation => setTransform(current => ({...current, saturation}))}/>
                        </div>
                        <div className="space-y-2">
                            <Slider label="Zoom" value={normalizedTransform.zoom} min={1} max={4} step={0.01} suffix="×" change={zoom => setTransform(current => normalizeTransform({...current, zoom}))}/>
                            <Slider label="Poziție X" value={normalizedTransform.panX} min={-maxPan} max={maxPan} suffix="%" change={panX => setTransform(current => normalizeTransform({...current, panX}))}/>
                            <Slider label="Poziție Y" value={normalizedTransform.panY} min={-maxPan} max={maxPan} suffix="%" change={panY => setTransform(current => normalizeTransform({...current, panY}))}/>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="flex min-h-9 flex-1 items-center justify-between rounded-xl bg-white/35 px-3 text-sm font-medium text-[#3a3a3c]">Flip orizontal<input type="checkbox" className="rounded text-[#007aff]" checked={transform.flipX} onChange={event => setTransform(current => ({...current, flipX: event.target.checked}))}/></label>
                        <button type="button" className="ios-secondary-button flex-1" onClick={() => void reset()}>Resetează</button>
                    </div>
                </aside>}
            </div>
        </div>
    </div>, document.body);
};

const Slider = ({label, value, min, max, step = 1, suffix, change}: {label: string; value: number; min: number; max: number; step?: number; suffix: string; change: (value: number) => void}) => <label className="block text-[11px] font-semibold text-[#65728a]"><span className="mb-0.5 flex justify-between gap-2"><span>{label}</span><span>{formatSliderValue(value)}{suffix}</span></span><input className="block h-5 w-full accent-[#2878ff]" type="range" value={value} min={min} max={max} step={step} onChange={event => change(Number(event.target.value))}/></label>;

const PlaylistNavigationButton = ({article, direction, onSelect}: {article: Article | null; direction: 'prev' | 'next'; onSelect: (articleId: number) => void}) => {
    const isPrevious = direction === 'prev';
    const label = isPrevious ? 'PREV' : 'NEXT';
    return (
        <button type="button" disabled={!article} onClick={() => article && onSelect(article.id)}
                className={`flex min-h-[62px] min-w-0 items-center gap-2 rounded-[16px] border border-white/75 bg-white/45 p-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.82)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40 ${isPrevious ? '' : 'flex-row-reverse text-right'}`}>
            {article?.image ? (
                <ImageWithLoader src={article.image.thumbnailUrl} alt="" containerClassName="h-11 w-16 shrink-0 overflow-hidden rounded-xl bg-[#e9edf5]" className="h-full w-full object-cover"/>
            ) : (
                <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-[#e9edf5] text-[#9aa8bc]"><PhotoIcon className="h-5 w-5"/></span>
            )}
            <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold tracking-[0.12em] text-[#286ee7]">{label}</span>
                <span className="mt-0.5 block line-clamp-2 text-xs font-semibold leading-4 text-[#172033]">{article ? article.technical_title || article.subtitle : isPrevious ? 'Începutul playlistului' : 'Sfârșitul playlistului'}</span>
            </span>
        </button>
    );
};

export default OnAirDialog;

function viewerDefaults(viewer: ViewerState): ViewerTransform {
    const source = viewer.transformDefaults;
    return {...defaults, brightness: clamp(source?.brightness), contrast: clamp(source?.contrast), saturation: clamp(source?.saturation)};
}

function clamp(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.min(200, Math.max(0, value)) : 100;
}

function maxPanForZoom(zoom: number): number {
    return Math.max(0, (Math.min(4, Math.max(1, zoom)) - 1) * 50);
}

function formatSliderValue(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return String(Object.is(rounded, -0) ? 0 : rounded);
}

function normalizeTransform(transform: ViewerTransform): ViewerTransform {
    const zoom = Math.min(4, Math.max(1, transform.zoom));
    const maxPan = maxPanForZoom(zoom);
    return {...transform, zoom, panX: Math.min(maxPan, Math.max(-maxPan, transform.panX)), panY: Math.min(maxPan, Math.max(-maxPan, transform.panY))};
}
