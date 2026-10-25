import {ArrowPathIcon, EyeSlashIcon, SignalIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';
import ImageEditorContent from '@/Components/Dialogs/ImageEditor/ImageEditorContent';
import AdjacentArticleButton from '@/Components/Articles/AdjacentArticleButton';
import {introPreview} from '@/Utils/editorialText';

export interface ViewerTransform {brightness: number; contrast: number; saturation: number; zoom: number; panX: number; panY: number; flipX: boolean}
export interface ViewerState {
    visible: boolean
    activeImage: {articleId: number; imageId: number; title: string; url: string} | null
    defaultImage?: {name: string; url: string} | null
    fr3?: {transform: ViewerTransform} | null
    transform: ViewerTransform
    transformDefaults?: ViewerTransform
    window?: {displayId: string | null; fullscreen: boolean; topmost: boolean}
    error: string | null
}
export const defaultViewerTransform: ViewerTransform = {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false};

interface LiveImageStageProps {
    article: Article | null
    previousArticle?: Article | null
    nextArticle?: Article | null
    previousDisabled: boolean
    nextDisabled: boolean
    onPrevious: () => void
    onNext: () => void
    viewer: ViewerState | null
    viewerBusy: boolean
    viewerError: string | null
    onRefreshViewer: () => void
    onShow: (article: Article, transform: ViewerTransform) => void
    onShowDefault: (article: Article, transform: ViewerTransform) => void
    onHide: () => void
    transform: ViewerTransform
    onTransformChange: (transform: ViewerTransform) => void
}

export function LiveImageStage({article, previousArticle = null, nextArticle = null, previousDisabled, nextDisabled, onPrevious, onNext, viewer, viewerBusy, viewerError, onRefreshViewer, onShow, onShowDefault, onHide, transform, onTransformChange}: LiveImageStageProps) {
    if (!article) return <section className="ios-card live-stage-empty"><p className="ios-eyebrow">PLASMA · PREVIEW</p><h2>Alege un material din playlist</h2><p>Selecția pregătită nu trimite comenzi către PlasmaViewer.</p></section>;
    const image = article.image;
    const defaultImage = !image ? viewer?.defaultImage : null;
    const previewImageUrl = image?.url ?? (defaultImage ? '/plasma-viewer/default-image' : null);
    const candidateIsActive = Boolean(viewer?.visible && viewer.activeImage?.articleId === article.id && (image ? viewer.activeImage.imageId === image.id : defaultImage && viewer.activeImage.imageId === 0));
    const previewTransform = image ? transform : viewer?.fr3?.transform ?? defaultViewerTransform;
    const normalizedZoom = Math.min(4, Math.max(1, previewTransform.zoom));
    const maxPan = Number(((normalizedZoom - 1) * 50).toFixed(1));
    const previewPanX = Math.min(maxPan, Math.max(-maxPan, previewTransform.panX));
    const previewPanY = Math.min(maxPan, Math.max(-maxPan, previewTransform.panY));
    const panX = Math.min(maxPan, Math.max(-maxPan, transform.panX));
    const panY = Math.min(maxPan, Math.max(-maxPan, transform.panY));
    const previewTransformStyle = {transform: `translate(${previewPanX}%, ${previewPanY}%) scale(${normalizedZoom})`};
    const imageStyle = {filter: `brightness(${previewTransform.brightness}%) contrast(${previewTransform.contrast}%) saturate(${previewTransform.saturation}%)`, transform: `scaleX(${previewTransform.flipX ? -1 : 1})`};
    const intro = introPreview(article.intro || '');

    const plasmaContent = <div className="live-stage-previews">
        <section className="live-preview-card live-preview-target">
            <div className="live-preview-layout">
                {previewImageUrl ? <div className="live-preview-image-wrap aspect-video bg-[#e9edf5]">
                    <div className="live-preview-pan-transform" style={previewTransformStyle}>
                        <ImageWithLoader src={previewImageUrl} alt={image ? 'Preview candidat' : `Imagine implicită PlasmaViewer: ${defaultImage?.name}`} containerClassName="block h-full w-full" className={`absolute inset-0 block h-full w-full origin-center ${image ? 'object-contain' : 'object-cover'}`} style={imageStyle}/>
                    </div>
                    {!image && defaultImage && <span className="live-preview-default-label">Imagine implicită PlasmaViewer · {defaultImage.name}</span>}
                    {image && <button type="button" className={`live-preview-flip-button${transform.flipX ? ' is-active' : ''}`} aria-label="Răstoarnă imaginea pe orizontală" title="Flip orizontal" aria-pressed={transform.flipX} disabled={viewerBusy} onClick={() => onTransformChange({...transform, flipX: !transform.flipX})}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M9 7 6 10l3 3M15 7l3 3-3 3M5 18h14"/></svg>
                    </button>}
                    {(image || defaultImage) && <button type="button" className={`live-preview-overlay-button${candidateIsActive ? ' is-active' : ''}`} disabled={viewerBusy} onClick={() => {
                        if (candidateIsActive) onHide();
                        else if (image) onShow(article, transform);
                        else if (defaultImage) onShowDefault(article, previewTransform);
                    }}>
                        {candidateIsActive ? <><EyeSlashIcon className="h-4 w-4"/>Ascunde imaginea</> : <><SignalIcon className="h-4 w-4"/>{viewerBusy ? 'Se procesează…' : defaultImage ? 'Afișează imaginea implicită' : 'Afișează'}</>}
                    </button>}
                </div> : <div className="aspect-video rounded-xl border border-dashed border-[#9aa8bc]/50 bg-white/35"/>}
                {image && <div className="live-preview-adjustments">
                    <div className="live-preview-adjustments-content">
                        <div className="live-transform-grid">
                            <Slider label="Luminozitate" value={transform.brightness} min={0} max={200} suffix="%" onChange={brightness => onTransformChange({...transform, brightness})}/>
                            <Slider label="Contrast" value={transform.contrast} min={0} max={200} suffix="%" onChange={contrast => onTransformChange({...transform, contrast})}/>
                            <Slider label="Saturație" value={transform.saturation} min={0} max={200} suffix="%" onChange={saturation => onTransformChange({...transform, saturation})}/>
                            <Slider label="Zoom" value={transform.zoom} min={1} max={4} step={0.01} suffix="×" onChange={zoom => {
                                const nextMaxPan = Number(((zoom - 1) * 50).toFixed(1));
                                onTransformChange({...transform, zoom, panX: Math.min(nextMaxPan, Math.max(-nextMaxPan, transform.panX)), panY: Math.min(nextMaxPan, Math.max(-nextMaxPan, transform.panY))});
                            }}/>
                            <Slider label="Poziție X" value={panX} min={maxPan ? -maxPan : -1} max={maxPan || 1} step={Math.max(0.01, maxPan / 100)} suffix="%" disabled={!maxPan} onChange={panX => onTransformChange({...transform, panX})}/>
                            <Slider label="Poziție Y" value={panY} min={maxPan ? -maxPan : -1} max={maxPan || 1} step={Math.max(0.01, maxPan / 100)} suffix="%" disabled={!maxPan} onChange={panY => onTransformChange({...transform, panY})}/>
                        </div>
                        <div className="live-stage-actions"><button type="button" className="live-reset-button" disabled={viewerBusy} onClick={() => onTransformChange(viewer?.transformDefaults || defaultViewerTransform)}>Resetează transformarea</button></div>
                    </div>
                </div>}
                {!image && defaultImage && intro && <div className="live-preview-intro" aria-label="Intro pentru știre">
                    <p className="ios-eyebrow">INTRO ȘTIRE</p>
                    <p>{intro}</p>
                </div>}
            </div>
        </section>
        <nav className="live-adjacent-articles" aria-label="Navigare articole preview">
            <AdjacentArticleButton article={previousArticle} direction="previous" disabled={previousDisabled} onClick={onPrevious}/>
            <AdjacentArticleButton article={nextArticle} direction="next" disabled={nextDisabled} onClick={onNext}/>
        </nav>
    </div>;

    return <section className="ios-card live-image-stage" aria-label="Preview și ieșire Plasma">
        <header className="live-stage-header"><div className="min-w-0"><p className="ios-eyebrow">PLASMA · CANDIDAT PENTRU IEȘIRE</p><h2 title={article.subtitle || article.title || article.technical_title}>#{article.playlist_order} {article.subtitle || article.title || article.technical_title}</h2></div>
            <div className="live-stage-nav"><button type="button" aria-label="Reîncarcă starea PlasmaViewer" title="Reîncarcă starea PlasmaViewer" onClick={onRefreshViewer} disabled={viewerBusy}><ArrowPathIcon className="h-4 w-4"/></button></div>
        </header>
        {viewerError && <p className="live-stage-error" role="alert">{viewerError}</p>}
        {viewer?.error && <p className="live-stage-error" role="alert">{viewer.error}</p>}
        <ImageEditorContent article={article} initialTab="plasma" operatorMode plasmaContent={plasmaContent} onImageSelected={() => undefined}/>
    </section>;
}

function Slider({label, value, min, max, step = 1, suffix, disabled = false, onChange}: {label: string; value: number; min: number; max: number; step?: number; suffix: string; disabled?: boolean; onChange: (value: number) => void}) {
    return <label className={`live-transform-control${disabled ? ' is-disabled' : ''}`}><span><span>{label}</span><strong>{Math.round(value * 10) / 10}{suffix}</strong></span><input type="range" value={value} min={min} max={max} step={step} disabled={disabled} onChange={event => onChange(Number(event.target.value))}/></label>;
}
