import {EyeIcon, PhotoIcon, PlusIcon, QueueListIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ArticleTypeBadge from '@/Components/Articles/ArticleTypeBadge';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface PlaylistArticleSidebarProps {
    articles: Article[]
    playlistTitle: string
    currentId: number
    previewId?: number | null
    mosArticleId?: number | null
    viewerActiveArticleId?: number | null
    live?: boolean
    onSelect: (id: number) => void
    onSelectMos: (id: number) => void
    onPreview: (id: number) => void
    onAddFirst: () => void
    onAddAfter: (article: Article) => void
}

const PlaylistArticleSidebar = ({articles, playlistTitle, currentId, previewId = null, mosArticleId = null, viewerActiveArticleId = null, live = false, onSelect, onSelectMos, onPreview, onAddFirst, onAddAfter}: PlaylistArticleSidebarProps) => (
    <aside className="playlist-sidebar ios-card flex min-h-0 flex-col overflow-hidden p-2 lg:sticky lg:top-[104px] lg:h-[calc(100vh-128px)]">
        <header className="shrink-0 px-3 pb-2 pt-2">
            <h1 className="break-words text-base font-bold leading-5 text-[#172033]">{playlistTitle}</h1>
            <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#65728a]">{articles.length} materiale</p>
            </div>
        </header>
        <div className="playlist-sidebar-list min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-3 pt-3 pr-1">
            {!articles.length && <div className="flex justify-center py-0.5">
                <button type="button" onClick={onAddFirst} aria-label="Adaugă material la începutul playlistului" title="Adaugă material la începutul playlistului"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#dbe4f1] bg-white text-[#2878ff] shadow-sm transition hover:scale-110 hover:bg-[#eaf1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2878ff]">
                    <PlusIcon className="h-4 w-4" strokeWidth={2.5}/>
                </button>
            </div>}
            {articles.map((article, index) => {
                const active = article.id === (live ? previewId : currentId);
                const plasmaActive = article.id === viewerActiveArticleId;
                const mosActive = article.id === mosArticleId;
                const types = (article.article_types?.length ? article.article_types : [article.article_type]).filter(type => type !== 'INTRO');
                const articleTitle = article.subtitle || article.title || article.technical_title;
                const markerColors = {
                    yellow: ['bg-[#e5ad16]', 'Fără conținut în ENPS'],
                    red: ['bg-[#c72f36]', 'Conținut neaprobat în ENPS'],
                    green: ['bg-[#5a9e45]', 'Conținut aprobat în ENPS'],
                } as const;
                const [markerClass, markerLabel] = article.enps_marker_color
                    ? markerColors[article.enps_marker_color]
                    : ['bg-[#cbd5e1]', 'Fără stare ENPS'];
                return (
                    <div key={article.id} className="group flex items-stretch gap-1.5">
                        <span role="img" aria-label={markerLabel} title={markerLabel} className={`my-2 w-[3px] shrink-0 rounded-full ${markerClass}`}/>
                        <div className="relative min-w-0 flex-1">
                            {index === 0 && <button type="button" onClick={onAddFirst} aria-label="Adaugă material la începutul playlistului" title="Adaugă material la începutul playlistului"
                                    className="absolute -top-2.5 left-5 z-10 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-[#f5f6fa] bg-white text-[#2878ff] shadow-sm transition hover:scale-110 group-hover:flex group-focus-within:flex">
                                <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5}/>
                            </button>}
                            <button type="button" onClick={() => onSelect(article.id)}
                                    aria-label={`${articleTitle}${plasmaActive ? ', Plasma activ' : ''}${mosActive ? ', MOS activ' : ''}`}
                                    className={`flex w-full items-center gap-2.5 rounded-[17px] border p-2 pr-12 text-left transition ${active ? 'border-[#2878ff]/25 bg-[#2878ff]/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]' : 'border-transparent hover:bg-white/55'}`}>
                                <span className="w-3 shrink-0 text-center text-[11px] font-semibold tabular-nums text-[#9aa8bc]">{article.playlist_order}</span>
                                {article.image ? (
                                    <ImageWithLoader src={article.image.thumbnailUrl} alt="" containerClassName="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e9edf5]" className="h-full w-full object-cover" loading="lazy" decoding="async"/>
                                ) : (
                                    <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-[#e9edf5] text-[#9aa8bc]">
                                        <PhotoIcon className="h-6 w-6"/>
                                    </span>
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="line-clamp-2 text-xs font-bold leading-4 text-[#172033]">{articleTitle}</span>
                                    <span className="mt-1.5 flex flex-wrap gap-1">
                                        {types.map(type => <ArticleTypeBadge key={type} type={type} compact/>) }
                                        {plasmaActive && <span title="Imaginea activă în PlasmaViewer" className="inline-flex items-center gap-1 rounded-full border border-[#ef4444]/25 bg-[#fee2e2] px-1.5 py-0.5 text-[9px] font-extrabold leading-none uppercase tracking-wide text-[#b42318]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#dc2626]"/>Plasma</span>}
                                        {mosActive && <span title="Articolul activ în MOS" className="inline-flex items-center gap-1 rounded-full border border-[#16a34a]/25 bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-extrabold leading-none uppercase tracking-wide text-[#166534]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#16a34a]"/>MOS</span>}
                                    </span>
                                </span>
                            </button>
                            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1">
                                <button type="button" onClick={() => onSelectMos(article.id)} aria-label={`Selectează MOS pentru ${articleTitle}`} title="Selectează articolul pentru MOS" aria-pressed={mosActive}
                                        className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition ${mosActive ? 'bg-[#dcfce7] text-[#166534] opacity-100' : 'bg-white/90 text-[#526078] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'} hover:bg-[#dcfce7] hover:text-[#166534] focus:opacity-100`}>
                                    <QueueListIcon className="h-4 w-4"/>
                                </button>
                                {article.image && !live && <button type="button" onClick={() => onPreview(article.id)} aria-label={`Pregătește preview pentru ${articleTitle}`} title="Pregătește preview"
                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#286ee7] opacity-0 shadow-sm transition hover:bg-[#dbeafe] focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100">
                                    <EyeIcon className="h-4 w-4"/>
                                </button>}
                            </div>
                            <button type="button" onClick={() => onAddAfter(article)} aria-label={`Adaugă material după ${article.subtitle || article.title || article.technical_title}`} title="Adaugă material după acest articol"
                                    className="absolute -bottom-2.5 left-5 z-10 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-[#f5f6fa] bg-white text-[#2878ff] shadow-sm transition hover:scale-110 group-hover:flex group-focus-within:flex">
                                <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5}/>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </aside>
);

export default PlaylistArticleSidebar;
