import {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import {createPortal} from 'react-dom';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface ViewerTransform {brightness: number; contrast: number; saturation: number; zoom: number; panX: number; panY: number; flipX: boolean}
interface ViewerState {visible: boolean; activeImage: {articleId: number; title: string; url: string} | null; transform: ViewerTransform; transformDefaults?: ViewerTransform; error: string | null}
const defaults: ViewerTransform = {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false};

const OnAirDialog = ({article, isOpen, onClose}: {article: Article; isOpen: boolean; onClose: () => void}) => {
    const [transform, setTransform] = useState(defaults);
    const [viewer, setViewer] = useState<ViewerState | null>(null);
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const initialized = useRef(false);

    const loadState = async () => {
        try {
            const {data} = await axios.get<ViewerState>(route('viewer.state'));
            setViewer(data);
            if (!initialized.current) { setTransform(viewerDefaults(data)); initialized.current = true; }
            setError(null);
        } catch (reason: any) {
            setError(reason.response?.data?.error ?? 'PlasmaViewer nu este disponibil.');
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        setSent(false);
        initialized.current = false;
        setTransform(viewer ? viewerDefaults(viewer) : {...defaults});
        void loadState();
        const timer = window.setInterval(loadState, 2000);
        return () => window.clearInterval(timer);
    }, [isOpen, article.id]);

    useEffect(() => {
        if (!isOpen || !sent) return;
        const timer = window.setTimeout(() => void command('transform', {transform}, false), 100);
        return () => window.clearTimeout(timer);
    }, [transform, sent, isOpen]);

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
        if (await command('show', {article_id: article.id, transform})) setSent(true);
    };

    const reset = async () => {
        setTransform({...defaults});
        if (sent) await command('reset-transform', {}, false);
    };

    if (!isOpen || !article.image) return null;
    const imageStyle = {filter: `brightness(${transform.brightness}%) contrast(${transform.contrast}%) saturate(${transform.saturation}%)`, transform: `translate(${transform.panX}%, ${transform.panY}%) scale(${transform.zoom}) scaleX(${transform.flipX ? -1 : 1})`};

    return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#12203a]/45 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Control onAIR">
        <div className="liquid-dialog max-h-[94vh] w-full max-w-5xl overflow-auto rounded-[30px] border border-white/75 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_30px_100px_rgba(15,29,62,0.34)] backdrop-blur-[32px]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#71809a]/10 bg-white/35 px-5 py-4 backdrop-blur-2xl">
                <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e13d37]">onAIR</p><h2 className="text-lg font-bold tracking-[-0.02em] text-[#172033]">{article.title || article.subtitle}</h2></div>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/50 text-[#65728a] shadow-sm hover:bg-white/85" onClick={onClose}><XMarkIcon className="h-5 w-5"/></button>
            </header>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section>
                    <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-inner"><ImageWithLoader src={article.image.url} alt="Preview onAIR" containerClassName="h-full w-full" className="h-full w-full object-cover" style={imageStyle}/></div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/75 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <div><p className="font-semibold text-[#172033]">{viewer?.visible ? 'Output activ' : 'Output ascuns'}</p><p className="text-xs text-[#65728a]">{viewer?.activeImage?.title ?? 'Nicio imagine în Viewer'}</p></div>
                        <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void command('hide')} className="ios-secondary-button">Ascunde</button><button type="button" disabled={busy} onClick={show} className="min-h-10 rounded-xl bg-[#ff3b30] px-5 font-semibold text-white disabled:opacity-50">{busy ? 'Se trimite…' : 'Afișează onAIR'}</button></div>
                    </div>
                    {error && <p className="mt-3 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-sm font-medium text-[#c9251c]">{error}</p>}
                </section>
                <aside className="space-y-4 rounded-[22px] border border-white/75 bg-white/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                    <h3 className="font-bold text-[#172033]">Ajustări imagine</h3>
                    <Slider label="Luminozitate" value={transform.brightness} min={0} max={200} suffix="%" change={brightness => setTransform(current => ({...current, brightness}))}/>
                    <Slider label="Contrast" value={transform.contrast} min={0} max={200} suffix="%" change={contrast => setTransform(current => ({...current, contrast}))}/>
                    <Slider label="Saturație" value={transform.saturation} min={0} max={200} suffix="%" change={saturation => setTransform(current => ({...current, saturation}))}/>
                    <Slider label="Zoom" value={transform.zoom} min={1} max={4} step={0.01} suffix="×" change={zoom => setTransform(current => ({...current, zoom}))}/>
                    <Slider label="Poziție X" value={transform.panX} min={-100} max={100} suffix="%" change={panX => setTransform(current => ({...current, panX}))}/>
                    <Slider label="Poziție Y" value={transform.panY} min={-100} max={100} suffix="%" change={panY => setTransform(current => ({...current, panY}))}/>
                    <label className="flex items-center justify-between text-sm font-medium text-[#3a3a3c]">Flip orizontal<input type="checkbox" className="rounded text-[#007aff]" checked={transform.flipX} onChange={event => setTransform(current => ({...current, flipX: event.target.checked}))}/></label>
                    <button type="button" className="ios-secondary-button w-full" onClick={() => void reset()}>Resetează ajustările</button>
                    <p className="text-xs leading-5 text-[#65728a]">După prima trimitere, modificările sunt aplicate live pe fereastra output.</p>
                </aside>
            </div>
        </div>
    </div>, document.body);
};

const Slider = ({label, value, min, max, step = 1, suffix, change}: {label: string; value: number; min: number; max: number; step?: number; suffix: string; change: (value: number) => void}) => <label className="block text-xs font-semibold text-[#65728a]"><span className="mb-1.5 flex justify-between"><span>{label}</span><span>{step < 1 ? value.toFixed(2) : value}{suffix}</span></span><input className="w-full accent-[#2878ff]" type="range" value={value} min={min} max={max} step={step} onChange={event => change(Number(event.target.value))}/></label>;

export default OnAirDialog;

function viewerDefaults(viewer: ViewerState): ViewerTransform {
    const source = viewer.transformDefaults;
    return {...defaults, brightness: clamp(source?.brightness), contrast: clamp(source?.contrast), saturation: clamp(source?.saturation)};
}

function clamp(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.min(200, Math.max(0, value)) : 100;
}
