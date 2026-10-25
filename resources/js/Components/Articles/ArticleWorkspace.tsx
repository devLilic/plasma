import React from 'react';
import {DocumentTextIcon, PhotoIcon, SignalIcon, TrashIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ArticleTypeBadge from '@/Components/Articles/ArticleTypeBadge';
import ImageEditorContent from '@/Components/Dialogs/ImageEditor/ImageEditorContent';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';
import {useActions} from '@/Hooks/useActions';
import ArticleTextContent from '@/Components/Articles/ArticleTextContent';
import ArticleMosContent from '@/Components/Articles/ArticleMosContent';
import {introPreview} from '@/Utils/editorialText';
import AdjacentArticleButton from '@/Components/Articles/AdjacentArticleButton';

interface ArticleWorkspaceProps {
    article: Article
    activeTab: 'text' | 'image'
    onTabChange: (tab: 'text' | 'image') => void
    onOpenOnAir: () => void
    onDelete: () => void
    showMos?: boolean
    operatorMode?: boolean
    previousArticle?: Article | null
    nextArticle?: Article | null
    onPreviousArticle?: () => void
    onNextArticle?: () => void
}

const ArticleWorkspace = ({article, activeTab, onTabChange, onOpenOnAir, onDelete, showMos = true, operatorMode = false, previousArticle = null, nextArticle = null, onPreviousArticle = () => {}, onNextArticle = () => {}}: ArticleWorkspaceProps) => {
    const {removeBackgroundImage} = useActions();
    const types = article.article_types?.length ? article.article_types : [article.article_type];
    const intro = introPreview(article.intro || '');

    return (
        <section className="ios-card min-w-0 overflow-hidden">
            <header className={`border-b border-white/70 px-4 pt-4 sm:px-6 sm:pt-5 ${operatorMode ? 'pb-2 sm:pb-3' : 'pb-4 sm:pb-5'}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {types.map(type => <ArticleTypeBadge key={type} type={type}/>)}
                            <span className="text-[11px] font-semibold text-[#9aa8bc]">#{article.playlist_order}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-bold uppercase tracking-[0.08em] text-[#65728a] sm:text-base">{article.subtitle || article.title || article.technical_title}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 rounded-2xl border border-white/70 bg-white/28 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.75)]">
                        {article.image && (
                            <button type="button" onClick={onOpenOnAir} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#ff3b30] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#e52f26]">
                                <SignalIcon className="h-4 w-4"/>onAIR
                            </button>
                        )}
                        {article.image && !operatorMode && <span className="mx-0.5 h-6 w-px bg-[#71809a]/20" aria-hidden="true"/>}
                        {!operatorMode && <div className="flex rounded-xl bg-white/35 p-0.5" role="tablist" aria-label="Conținut material">
                            <button type="button" onClick={() => onTabChange('image')} title="Imagine" aria-label="Imagine" aria-selected={activeTab === 'image'} role="tab"
                                    className={`flex h-8 w-9 items-center justify-center rounded-[10px] transition ${activeTab === 'image' ? 'bg-white text-[#286ee7] shadow-sm' : 'text-[#65728a] hover:bg-white/55'}`}>
                                <PhotoIcon className="h-[18px] w-[18px]"/>
                            </button>
                            <button type="button" onClick={() => onTabChange('text')} title="Text" aria-label="Text" aria-selected={activeTab === 'text'} role="tab"
                                    className={`flex h-8 w-9 items-center justify-center rounded-[10px] transition ${activeTab === 'text' ? 'bg-white text-[#286ee7] shadow-sm' : 'text-[#65728a] hover:bg-white/55'}`}>
                                <DocumentTextIcon className="h-[18px] w-[18px]"/>
                            </button>
                        </div>}
                        {!operatorMode && <span className="mx-0.5 h-6 w-px bg-[#71809a]/20" aria-hidden="true"/>}
                        <button type="button" onClick={onDelete} className="ios-danger-button !min-h-9" aria-label="Șterge materialul">
                            <TrashIcon className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </header>

            <div className={`min-h-[520px] px-4 pb-4 sm:px-6 sm:pb-6 ${operatorMode ? 'pt-2 sm:pt-3' : 'pt-4 sm:pt-6'}`}>
                {!operatorMode && activeTab === 'text' ? (
                    <ArticleTextContent article={article} showMosTimeline={showMos}/>
                ) : (
                    <div className="space-y-5">
                        {operatorMode && !article.image && <section data-operator-intro className="mx-auto max-w-4xl rounded-[20px] border border-white/70 bg-white/35 p-4 sm:p-5" aria-label="Intro pentru știre">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Intro știre</p>
                            <p className="mt-2 whitespace-pre-wrap break-normal text-sm leading-6 text-[#2c3443] [hyphens:none]">{intro || 'Acest material nu are intro.'}</p>
                        </section>}
                        {article.image ? (
                            <div className={`relative mx-auto grid max-w-4xl rounded-[22px] border border-white/75 bg-white/50 shadow-sm ${operatorMode ? 'grid-cols-1 overflow-hidden md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]' : 'gap-5 p-4 pr-14 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]'}`}>
                                <div className={`min-w-0 ${operatorMode ? 'h-full' : ''}`}>
                                    <div className={`article-image-preview relative ${operatorMode ? 'h-full' : ''}`}>
                                        <ImageWithLoader src={article.image.thumbnailUrl} alt="Imagine selectată" containerClassName={`w-full overflow-hidden bg-[#e9edf5] ${operatorMode ? 'h-full' : 'aspect-video rounded-2xl'}`} className="h-full w-full object-cover"/>
                                        <button type="button" onClick={() => removeBackgroundImage({article_id: article.id})} className="ios-danger-button absolute right-3 top-3" aria-label="Elimină legătura cu imaginea" title="Elimină legătura cu imaginea">
                                            <XMarkIcon className="h-4 w-4"/>
                                        </button>
                                        {article.image.tags?.length > 0 && <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap gap-1.5">
                                            {article.image.tags.map(tag => (
                                                <span key={tag.id} className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#286ee7] shadow-sm backdrop-blur-sm">{tag.title}</span>
                                            ))}
                                        </div>}
                                    </div>
                                </div>
                                <div data-operator-intro={operatorMode ? '' : undefined} aria-label={operatorMode ? 'Intro pentru știre' : undefined} className={`flex min-w-0 flex-col justify-center ${operatorMode ? 'p-4 sm:p-5' : ''}`}>
                                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Intro știre</p>
                                    <p className={`mt-2 text-sm leading-6 text-[#2c3443] [hyphens:none] ${operatorMode ? 'whitespace-pre-wrap break-normal' : 'line-clamp-6 overflow-hidden whitespace-normal break-normal'}`}>{intro || 'Acest material nu are intro.'}</p>
                                </div>
                            </div>
                        ) : (
                            !operatorMode ? <div className="mx-auto max-w-4xl rounded-[20px] border border-white/70 bg-white/35 p-4 sm:p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Intro știre</p>
                                <p className="mt-2 line-clamp-6 overflow-hidden whitespace-normal break-normal text-sm leading-6 text-[#2c3443] [hyphens:none]">{intro || 'Acest material nu are intro.'}</p>
                            </div> : null
                        )}
                        {operatorMode && <nav className="live-adjacent-articles" aria-label="Navigare articole Pregătire" data-operator-navigation>
                            <AdjacentArticleButton article={previousArticle} direction="previous" disabled={!previousArticle} onClick={onPreviousArticle}/>
                            <AdjacentArticleButton article={nextArticle} direction="next" disabled={!nextArticle} onClick={onNextArticle}/>
                        </nav>}
                        {showMos && <ArticleMosContent objects={article.mos_objects}/>}
                        <ImageEditorContent article={article} operatorMode={operatorMode}/>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ArticleWorkspace;
