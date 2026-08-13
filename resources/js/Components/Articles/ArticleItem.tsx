import React, {ChangeEvent, useState} from 'react';
import {CheckIcon} from '@heroicons/react/24/solid';
import ArticleHeader from '@/Components/Articles/ArticleHeader';
import ArticleFooter from '@/Components/Articles/ArticleFooter';
import ContentWithImage from '@/Components/Articles/ContentWithImage';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {useActions} from '@/Hooks/useActions';
import {selectArticleById} from '@/Store/article/article.slice';
import OnAirDialog from '@/Components/Dialogs/OnAirDialog';

interface ArticleItemProps {
    articleId: number
    openDialog: () => void
    confirm: () => void
}

const ArticleItem = ({articleId, openDialog, confirm}: ArticleItemProps) => {
    const article = useTypedSelector(state => selectArticleById(state, articleId));
    const [isOnAirOpen, setIsOnAirOpen] = useState(false);
    const {changeSearchBy, changeTitle, changeSubtitle, saveArticleContent} = useActions();
    const persistContent = () => saveArticleContent({id: article.id, title: article.title, subtitle: article.subtitle});

    const field = (kind: 'title' | 'subtitle', value: string, onChange: (event: ChangeEvent<HTMLInputElement>) => void) => {
        const selected = article.search_by === kind;
        return (
            <div className={`flex items-center gap-3 rounded-xl border p-3 transition ${selected ? 'border-[#007aff]/30 bg-[#007aff]/[0.055]' : 'border-transparent bg-[#f2f2f7]'}`}>
                <button type="button" aria-label={kind === 'title' ? 'Folosește titlul pentru căutare' : 'Folosește subtitlul pentru căutare'} onClick={() => changeSearchBy({id: article.id, changes: {search_by: kind}})} className="shrink-0">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#007aff] bg-[#007aff] text-white' : 'border-[#c7c7cc] bg-white'}`}>
                        {selected && <CheckIcon className="h-3 w-3"/>}
                    </span>
                </button>
                <input aria-label={kind === 'title' ? 'Titlul materialului' : 'Subtitlul materialului'} value={value} onChange={onChange} onBlur={persistContent} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium leading-5 text-[#1c1c1e] outline-none ring-0 focus:ring-0"/>
            </div>
        );
    };

    return (
        <article className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_9px_28px_rgba(0,0,0,0.065)] transition hover:-translate-y-0.5 hover:shadow-[0_13px_34px_rgba(0,0,0,0.09)]">
            <ArticleHeader id={article.id} title={article.subtitle} article_type={article.article_type} confirm={confirm}/>
            {article.image?.url ? (
                <ContentWithImage articleId={articleId} image={article.image}/>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col justify-center space-y-2.5 p-3">
                    {field('title', article.title, event => changeTitle({id: article.id, changes: {title: event.target.value}}))}
                    {field('subtitle', article.subtitle, event => changeSubtitle({id: article.id, changes: {subtitle: event.target.value}}))}
                </div>
            )}
            <ArticleFooter articleId={article.id} openDialog={openDialog} openOnAir={() => setIsOnAirOpen(true)}/>
            <OnAirDialog article={article} isOpen={isOnAirOpen} onClose={() => setIsOnAirOpen(false)}/>
        </article>
    );
};

export default ArticleItem;
