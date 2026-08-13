import React from 'react';
import {TrashIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import {useActions} from '@/Hooks/useActions';

interface ArticleHeaderProps {
    id: number
    title: string
    article_type: Article['article_type']
    confirm: () => void
}

const ArticleHeader = ({id, title, article_type, confirm}: ArticleHeaderProps) => {
    const {markForDelete} = useActions();
    const remove = () => {
        markForDelete(id);
        confirm();
    };

    return (
        <header className="flex min-h-[76px] items-center gap-3 border-b border-[#e5e5ea] px-4 py-4">
            <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] px-2 text-[11px] font-bold ${article_type === 'OFF' ? 'bg-[#ff9500]/10 text-[#ff9500]' : 'bg-[#5856d6]/10 text-[#5856d6]'}`}>
                {article_type === 'OFF' ? 'OFF' : 'BETA'}
            </span>
            <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-5 text-[#1c1c1e]">{title || 'Material fără titlu'}</h3>
            <button type="button" onClick={remove} className="ios-danger-button" aria-label="Șterge materialul">
                <TrashIcon className="h-4 w-4"/>
            </button>
        </header>
    );
};

export default ArticleHeader;
