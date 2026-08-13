import React from 'react';
import {InformationCircleIcon, PhotoIcon} from '@heroicons/react/24/outline';
import {Popover, PopoverContent, PopoverHandler} from '@material-tailwind/react';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectArticleById} from '@/Store/article/article.slice';
import {useActions} from '@/Hooks/useActions';
import SearchExternalImages from '@/Components/ExternalImages/SearchExternalImages';

interface ArticleFooterProps {
    articleId: number
    openDialog: () => void
}

const ArticleFooter = ({articleId, openDialog}: ArticleFooterProps) => {
    const article = useTypedSelector(state => selectArticleById(state, articleId));
    const {setCurrent} = useActions();
    const query = article.search_by === 'title' ? article.title : article.subtitle;
    const editArticle = () => {
        setCurrent({id: articleId});
        openDialog();
    };

    return (
        <footer className="mt-auto flex shrink-0 items-center gap-1.5 border-t border-[#e5e5ea] px-3 py-2.5">
            {article.intro && (
                <Popover>
                    <PopoverHandler>
                        <button type="button" className="ios-secondary-button !min-h-9 !px-2.5" aria-label="Vezi introducerea">
                            <InformationCircleIcon className="h-4 w-4"/>
                        </button>
                    </PopoverHandler>
                    <PopoverContent className="z-50 max-w-sm rounded-2xl border border-black/5 bg-white/95 p-4 text-sm leading-6 text-[#1c1c1e] shadow-xl backdrop-blur-xl" placeholder={undefined}>
                        {article.intro}
                    </PopoverContent>
                </Popover>
            )}
            <SearchExternalImages query={query} withModal={editArticle}/>
            <button type="button" onClick={editArticle} className="ios-secondary-button ml-auto !min-h-9 !px-2.5" aria-label="Alege imagine din bibliotecă">
                <PhotoIcon className="h-4 w-4"/>
            </button>
        </footer>
    );
};

export default ArticleFooter;
