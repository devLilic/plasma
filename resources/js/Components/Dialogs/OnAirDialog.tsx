import {useEffect, useState} from 'react';
import axios from 'axios';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import {createPortal} from 'react-dom';

interface ViewerTransform {brightness: number; zoom: number; panX: number; panY: number; flipX: boolean}
interface ViewerState {visible: boolean; activeImage: {articleId: number; title: string; url: string} | null; transform: ViewerTransform; error: string | null}
const defaults: ViewerTransform = {brightness: 100, zoom: 1, panX: 0, panY: 0, flipX: false};

const OnAirDialog = ({article, isOpen, onClose}: {article: Article; isOpen: boolean; onClose: () => void}) => {
    const [transform, setTransform] = useState(defaults);
    const [viewer, setViewer] = useState<ViewerState | null>(null);
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadState = async () => {
        try {
            const {data} = await axios.get<ViewerState>(route('viewer.state'));
            setViewer(data);
            setError(null);
        } catch (reason: any) {
            setError(reason.response?.data?.error ?? 'PlasmaViewer nu este disponibil.');
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        setSent(false);
        setTransform({...defaults});
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
    const imageStyle = {filter: `brightness(${transform.brightness}%)`, transform: `translate(${transform.panX}%, ${transform.panY}%) scale(${transform.zoom}) scaleX(${transform.flipX ? -1 : 1})`};

    return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Control onAIR">
        <div className="max-h-[94vh] w-full max-w-5xl overflow-auto rounded-[24px] bg-[#f2f2f7] shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/90 px-5 py-4 backdrop-blur-xl">
                <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff3b30]">onAIR</p><h2 className="text-lg font-semibold text-[#1c1c1e]">{article.title || article.subtitle}</h2></div>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5e5ea]" onClick={onClose}><XMarkIcon className="h-5 w-5"/></button>
            </header>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section>
                    <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-inner"><img src={article.image.url} alt="Preview onAIR" className="h-full w-full object-cover" style={imageStyle}/></div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
                        <div><p className="font-semibold text-[#1c1c1e]">{viewer?.visible ? 'Output activ' : 'Output ascuns'}</p><p className="text-xs text-[#8e8e93]">{viewer?.activeImage?.title ?? 'Nicio imagine în Viewer'}</p></div>
                        <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void command('hide')} className="ios-secondary-button">Ascunde</button><button type="button" disabled={busy} onClick={show} className="min-h-10 rounded-xl bg-[#ff3b30] px-5 font-semibold text-white disabled:opacity-50">{busy ? 'Se trimite…' : 'Afișează onAIR'}</button></div>
                    </div>
                    {error && <p className="mt-3 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-sm font-medium text-[#c9251c]">{error}</p>}
                </section>
                <aside className="space-y-4 rounded-2xl bg-white p-5">
                    <h3 className="font-semibold text-[#1c1c1e]">Ajustări imagine</h3>
                    <Slider label="Luminozitate" value={transform.brightness} min={0} max={200} suffix="%" change={brightness => setTransform(current => ({...current, brightness}))}/>
                    <Slider label="Zoom" value={transform.zoom} min={1} max={4} step={0.01} suffix="×" change={zoom => setTransform(current => ({...current, zoom}))}/>
                    <Slider label="Poziție X" value={transform.panX} min={-100} max={100} suffix="%" change={panX => setTransform(current => ({...current, panX}))}/>
                    <Slider label="Poziție Y" value={transform.panY} min={-100} max={100} suffix="%" change={panY => setTransform(current => ({...current, panY}))}/>
                    <label className="flex items-center justify-between text-sm font-medium text-[#3a3a3c]">Flip orizontal<input type="checkbox" className="rounded text-[#007aff]" checked={transform.flipX} onChange={event => setTransform(current => ({...current, flipX: event.target.checked}))}/></label>
                    <button type="button" className="ios-secondary-button w-full" onClick={() => void reset()}>Resetează ajustările</button>
                    <p className="text-xs leading-5 text-[#8e8e93]">După prima trimitere, modificările sunt aplicate live pe fereastra output.</p>
                </aside>
            </div>
        </div>
    </div>, document.body);
};

const Slider = ({label, value, min, max, step = 1, suffix, change}: {label: string; value: number; min: number; max: number; step?: number; suffix: string; change: (value: number) => void}) => <label className="block text-xs font-semibold text-[#636366]"><span className="mb-1.5 flex justify-between"><span>{label}</span><span>{step < 1 ? value.toFixed(2) : value}{suffix}</span></span><input className="w-full accent-[#007aff]" type="range" value={value} min={min} max={max} step={step} onChange={event => change(Number(event.target.value))}/></label>;

export default OnAirDialog;
