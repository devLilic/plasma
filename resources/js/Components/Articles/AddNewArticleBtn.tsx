import React from 'react';
import {PlusIcon} from '@heroicons/react/24/outline';
import {useActions} from '@/Hooks/useActions';
import {useTypedSelector} from '@/Hooks/useTypedSelector';

interface AddNewArticleBtnProps {
    handleDialog: () => void
    articleID?: number
    label?: string
    compact?: boolean
}

const AddNewArticleBtn = ({handleDialog, articleID, label, compact = false}: AddNewArticleBtnProps) => {
    const {changeNewArticlePosition} = useActions();
    const articleOrder = useTypedSelector(state => articleID ? state.articles.entities[articleID]?.playlist_order ?? 0 : 0);

    const addArticle = () => {
        changeNewArticlePosition(articleOrder + 1);
        handleDialog();
    };

    if (compact) {
        return (
            <button type="button" onClick={addArticle} aria-label="Adaugă material după acesta"
                    className="absolute -bottom-5 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#f2f2f7] bg-white text-[#007aff] shadow-md transition hover:scale-110 hover:bg-[#007aff] hover:text-white">
                <PlusIcon className="h-4 w-4" strokeWidth={2.5}/>
            </button>
        );
    }

    return (
        <button type="button" onClick={addArticle} className="ios-secondary-button">
            <PlusIcon className="h-4 w-4"/>{label ?? 'Adaugă'}
        </button>
    );
};

export default AddNewArticleBtn;
