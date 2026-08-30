import React from 'react';
import {DocumentTextIcon, PhotoIcon, SignalIcon, Square2StackIcon, TrashIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ArticleTypeBadge from '@/Components/Articles/ArticleTypeBadge';
import ImageEditorContent from '@/Components/Dialogs/ImageEditor/ImageEditorContent';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';
import {useActions} from '@/Hooks/useActions';

interface ArticleWorkspaceProps {
    article: Article
    activeTab: 'text' | 'image'
    onTabChange: (tab: 'text' | 'image') => void
    onOpenImageModal: () => void
    onOpenOnAir: () => void
    onDelete: () => void
}

const ArticleWorkspace = ({article, activeTab, onTabChange, onOpenImageModal, onOpenOnAir, onDelete}: ArticleWorkspaceProps) => {
    const {removeBackgroundImage} = useActions();
    const types = article.article_types?.length ? article.article_types : [article.article_type];

    return (
        <section className="ios-card min-w-0 overflow-hidden">
            <header className="border-b border-white/70 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {types.map(type => <ArticleTypeBadge key={type} type={type}/>)}
                            <span className="text-[11px] font-semibold text-[#9aa8bc]">#{article.playlist_order}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-bold uppercase tracking-[0.08em] text-[#65728a] sm:text-base">{article.technical_title || article.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 rounded-2xl border border-white/70 bg-white/28 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.75)]">
                        {article.image && (
                            <button type="button" onClick={onOpenOnAir} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#ff3b30] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#e52f26]">
                                <SignalIcon className="h-4 w-4"/>onAIR
                            </button>
                        )}
                        <span className="mx-0.5 h-6 w-px bg-[#71809a]/20" aria-hidden="true"/>
                        <div className="flex rounded-xl bg-white/35 p-0.5" role="tablist" aria-label="Conținut material">
                            <button type="button" onClick={() => onTabChange('image')} title="Imagine" aria-label="Imagine" aria-selected={activeTab === 'image'} role="tab"
                                    className={`flex h-8 w-9 items-center justify-center rounded-[10px] transition ${activeTab === 'image' ? 'bg-white text-[#286ee7] shadow-sm' : 'text-[#65728a] hover:bg-white/55'}`}>
                                <PhotoIcon className="h-[18px] w-[18px]"/>
                            </button>
                            <button type="button" onClick={() => onTabChange('text')} title="Text" aria-label="Text" aria-selected={activeTab === 'text'} role="tab"
                                    className={`flex h-8 w-9 items-center justify-center rounded-[10px] transition ${activeTab === 'text' ? 'bg-white text-[#286ee7] shadow-sm' : 'text-[#65728a] hover:bg-white/55'}`}>
                                <DocumentTextIcon className="h-[18px] w-[18px]"/>
                            </button>
                        </div>
                        <span className="mx-0.5 h-6 w-px bg-[#71809a]/20" aria-hidden="true"/>
                        <button type="button" onClick={onOpenImageModal} className="ios-secondary-button !min-h-9 !px-3">
                            <Square2StackIcon className="h-4 w-4"/>Modal imagine
                        </button>
                        <button type="button" onClick={onDelete} className="ios-danger-button !min-h-9" aria-label="Șterge materialul">
                            <TrashIcon className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </header>

            <div className="min-h-[520px] p-4 sm:p-6">
                {activeTab === 'text' ? (
                    <div className="mx-auto max-w-4xl space-y-4">
                        {article.content_sections.length ? article.content_sections.map((section, index) => (
                            <article key={`${section.slug}-${index}`} className="rounded-[20px] border border-white/75 bg-white/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.85)] sm:p-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#71809a]/10 pb-3">
                                    <span className="rounded-lg bg-[#172033]/[0.06] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-[#526078]">{section.type}</span>
                                    {section.slug && <span className="max-w-full truncate text-[10px] font-medium text-[#9aa8bc]">{section.slug}</span>}
                                </div>
                                {section.paragraphs.length ? (
                                    <div className="space-y-3 text-[15px] leading-7 text-[#2c3443]">
                                        {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-wrap">{paragraph}</p>)}
                                    </div>
                                ) : <p className="text-sm italic text-[#9aa8bc]">Secțiune fără text.</p>}
                            </article>
                        )) : (
                            <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#9aa8bc]/35 bg-white/25 px-6 text-center">
                                <DocumentTextIcon className="mb-3 h-10 w-10 text-[#9aa8bc]"/>
                                <p className="font-semibold text-[#172033]">Nu există text structurat</p>
                                <p className="mt-1 max-w-md text-sm leading-6 text-[#65728a]">Acest material provine dintr-un playlist vechi sau a fost adăugat manual.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {article.image ? (
                            <div className="relative mx-auto grid max-w-4xl gap-5 rounded-[22px] border border-white/75 bg-white/50 p-4 pr-14 shadow-sm md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
                                <div className="min-w-0">
                                    <ImageWithLoader src={article.image.thumbnailUrl} alt="Imagine selectată" containerClassName="aspect-video w-full overflow-hidden rounded-2xl bg-[#e9edf5]" className="h-full w-full object-cover"/>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {article.image.tags?.length ? article.image.tags.map(tag => (
                                            <span key={tag.id} className="rounded-full bg-[#2878ff]/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#286ee7]">{tag.title}</span>
                                        )) : <span className="text-xs text-[#9aa8bc]">Fără etichete</span>}
                                    </div>
                                </div>
                                <div className="flex min-w-0 flex-col justify-center">
                                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Intro știre</p>
                                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#2c3443]">{article.intro || 'Acest material nu are intro.'}</p>
                                </div>
                                <button type="button" onClick={() => removeBackgroundImage({article_id: article.id})} className="ios-danger-button absolute right-3 top-3" aria-label="Elimină legătura cu imaginea" title="Elimină legătura cu imaginea">
                                    <XMarkIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        ) : (
                            <div className="mx-auto max-w-4xl rounded-[20px] border border-white/70 bg-white/35 p-4 sm:p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Intro știre</p>
                                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#2c3443]">{article.intro || 'Acest material nu are intro.'}</p>
                            </div>
                        )}
                        <ImageEditorContent/>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ArticleWorkspace;
