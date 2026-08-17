import {ChangeEvent, useState} from 'react';
import {DocumentTextIcon, PhotoIcon, SignalIcon, Square2StackIcon, TrashIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ArticleTypeBadge from '@/Components/Articles/ArticleTypeBadge';
import ImageEditorContent from '@/Components/Dialogs/ImageEditor/ImageEditorContent';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';
import OnAirDialog from '@/Components/Dialogs/OnAirDialog';
import {useActions} from '@/Hooks/useActions';

interface ArticleWorkspaceProps {
    article: Article
    activeTab: 'text' | 'image'
    onTabChange: (tab: 'text' | 'image') => void
    onOpenImageModal: () => void
    onDelete: () => void
}

const ArticleWorkspace = ({article, activeTab, onTabChange, onOpenImageModal, onDelete}: ArticleWorkspaceProps) => {
    const [isOnAirOpen, setIsOnAirOpen] = useState(false);
    const {changeTitle, changeSubtitle, saveArticleContent, removeBackgroundImage} = useActions();
    const types = article.article_types?.length ? article.article_types : [article.article_type];
    const persistContent = () => saveArticleContent({id: article.id, title: article.title, subtitle: article.subtitle});
    const updateField = (field: 'title' | 'subtitle', event: ChangeEvent<HTMLInputElement>) => {
        const action = field === 'title' ? changeTitle : changeSubtitle;
        action({id: article.id, changes: {[field]: event.target.value}});
    };

    return (
        <section className="ios-card min-w-0 overflow-hidden">
            <header className="border-b border-white/70 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {types.map(type => <ArticleTypeBadge key={type} type={type}/>)}
                            <span className="text-[11px] font-semibold text-[#9aa8bc]">#{article.playlist_order}</span>
                        </div>
                        <p className="mt-2 truncate text-xs font-bold uppercase tracking-[0.1em] text-[#65728a]">{article.technical_title || article.subtitle}</p>
                        <input value={article.title} onChange={event => updateField('title', event)} onBlur={persistContent}
                               aria-label="Titlul editorial" className="mt-1 w-full border-0 bg-transparent p-0 text-xl font-bold tracking-[-0.025em] text-[#172033] outline-none ring-0 placeholder:text-[#9aa8bc] focus:ring-0 sm:text-2xl" placeholder="Titlu editorial"/>
                        <input value={article.subtitle} onChange={event => updateField('subtitle', event)} onBlur={persistContent}
                               aria-label="Termenul tehnic pentru căutare" className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-[#65728a] outline-none ring-0 focus:ring-0"/>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {article.image && (
                            <button type="button" onClick={() => setIsOnAirOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#ff3b30] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#e52f26]">
                                <SignalIcon className="h-4 w-4"/>onAIR
                            </button>
                        )}
                        <button type="button" onClick={onOpenImageModal} className="ios-secondary-button !min-h-9 !px-3">
                            <Square2StackIcon className="h-4 w-4"/>Modal imagine
                        </button>
                        <button type="button" onClick={onDelete} className="ios-danger-button !min-h-9" aria-label="Șterge materialul">
                            <TrashIcon className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
                <div className="mt-5 grid max-w-sm grid-cols-2 gap-1 rounded-[15px] border border-white/65 bg-white/30 p-1">
                    <button type="button" onClick={() => onTabChange('text')} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'text' ? 'bg-white text-[#286ee7] shadow-sm' : 'text-[#65728a] hover:bg-white/45'}`}>
                        <DocumentTextIcon className="h-4 w-4"/>Text
                    </button>
                    <button type="button" onClick={() => onTabChange('image')} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'image' ? 'bg-white text-[#286ee7] shadow-sm' : 'text-[#65728a] hover:bg-white/45'}`}>
                        <PhotoIcon className="h-4 w-4"/>Imagine
                    </button>
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
                        {article.image && (
                            <div className="mx-auto flex max-w-3xl items-center gap-4 rounded-[20px] border border-white/75 bg-white/50 p-3 shadow-sm">
                                <ImageWithLoader src={article.image.thumbnailUrl} alt="Imagine selectată" containerClassName="h-20 w-32 shrink-0 overflow-hidden rounded-2xl bg-[#e9edf5]" className="h-full w-full object-cover"/>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Imagine selectată</p>
                                    <p className="mt-1 truncate text-sm font-semibold text-[#172033]">{article.image.tags?.map(tag => tag.title).join(', ') || article.technical_title}</p>
                                </div>
                                <button type="button" onClick={() => removeBackgroundImage({article_id: article.id})} className="ios-danger-button" aria-label="Elimină imaginea">
                                    <XMarkIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        )}
                        <ImageEditorContent/>
                    </div>
                )}
            </div>
            <OnAirDialog article={article} isOpen={isOnAirOpen} onClose={() => setIsOnAirOpen(false)}/>
        </section>
    );
};

export default ArticleWorkspace;
