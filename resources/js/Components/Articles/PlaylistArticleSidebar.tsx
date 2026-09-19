import {PhotoIcon, PlusIcon, SignalIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ArticleTypeBadge from '@/Components/Articles/ArticleTypeBadge';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface PlaylistArticleSidebarProps {
    articles: Article[]
    currentId: number
    onSelect: (id: number) => void
    onOpenOnAir: (id: number) => void
    onAddAfter: (article: Article) => void
}

const PlaylistArticleSidebar = ({articles, currentId, onSelect, onOpenOnAir, onAddAfter}: PlaylistArticleSidebarProps) => (
    <aside className="playlist-sidebar ios-card min-h-0 overflow-hidden p-2 lg:sticky lg:top-[104px] lg:h-[calc(100vh-128px)]">
        <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#7c899d]">Playlist</p>
                <p className="mt-0.5 text-sm font-semibold text-[#172033]">{articles.length} materiale</p>
            </div>
        </div>
        <div className="playlist-sidebar-list max-h-[420px] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100%-58px)]">
            {articles.map(article => {
                const active = article.id === currentId;
                const types = article.article_types?.length ? article.article_types : [article.article_type];
                return (
                    <div key={article.id} className="group relative">
                        <button type="button" onClick={() => onSelect(article.id)}
                                className={`flex w-full items-center gap-2.5 rounded-[17px] border p-2 text-left transition ${article.image ? 'pr-11' : ''} ${active ? 'border-[#2878ff]/25 bg-[#2878ff]/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]' : 'border-transparent hover:bg-white/55'}`}>
                            <span className="w-5 shrink-0 text-center text-[10px] font-semibold tabular-nums text-[#9aa8bc]">{article.playlist_order}</span>
                            {article.image ? (
                                <ImageWithLoader src={article.image.thumbnailUrl} alt="" containerClassName="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e9edf5]" className="h-full w-full object-cover" loading="lazy" decoding="async"/>
                            ) : (
                                <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-[#e9edf5] text-[#9aa8bc]">
                                    <PhotoIcon className="h-6 w-6"/>
                                </span>
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="line-clamp-2 text-xs font-bold leading-4 text-[#172033]">{article.technical_title || article.subtitle}</span>
                                <span className="mt-1.5 flex flex-wrap gap-1">
                                    {types.map(type => <ArticleTypeBadge key={type} type={type}/>) }
                                </span>
                            </span>
                        </button>
                        {article.image && (
                            <button type="button" onClick={() => onOpenOnAir(article.id)} aria-label={`Deschide onAIR pentru ${article.technical_title || article.subtitle}`} title="Deschide onAIR"
                                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[#ff3b30] text-white opacity-0 shadow-sm transition hover:bg-[#e52f26] focus:opacity-100 group-hover:opacity-100">
                                <SignalIcon className="h-4 w-4"/>
                            </button>
                        )}
                        <button type="button" onClick={() => onAddAfter(article)} aria-label={`Adaugă material după ${article.technical_title || article.subtitle}`}
                                className="absolute -bottom-2.5 left-7 z-10 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-[#f5f6fa] bg-white text-[#2878ff] shadow-sm transition hover:scale-110 group-hover:flex group-focus-within:flex">
                            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5}/>
                        </button>
                    </div>
                );
            })}
        </div>
    </aside>
);

export default PlaylistArticleSidebar;
