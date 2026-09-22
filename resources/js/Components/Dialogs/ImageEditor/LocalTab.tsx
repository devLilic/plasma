import React, {useEffect, useRef, useState} from 'react';
import {MagnifyingGlassIcon} from '@heroicons/react/24/outline';
import ImagesList from '@/Components/LocalImages/ImagesList';
import {useActions} from '@/Hooks/useActions';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import Loading from '@/Components/UI/Svg/Loading';
import {Article} from '@/types';

interface LocalTabProps {
    article: Article
    onImageSelected: () => void
    autoFocusSearch?: boolean
}

const LocalTab = ({article, onImageSelected, autoFocusSearch = false}: LocalTabProps) => {
    const [searchTag, setSearchTag] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const loading = useTypedSelector(state => state.images.loading);
    const error = useTypedSelector(state => state.images.error);
    const {fetchImages, searchImages} = useActions();

    useEffect(() => {
        const timer = setTimeout(() => searchTag.length > 1
            ? searchImages({query: searchTag, articleId: article.id})
            : fetchImages({limit: 100, articleId: article.id}), 250);
        return () => clearTimeout(timer);
    }, [searchTag, article.id]);

    useEffect(() => {
        if (autoFocusSearch) searchRef.current?.focus();
    }, [autoFocusSearch]);

    return (
        <div>
            <div className="relative mx-auto mb-5 max-w-md">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#7c899d]"/>
                <input ref={searchRef} className="ios-search" value={searchTag} onChange={event => setSearchTag(event.target.value)} placeholder="Caută după etichetă"/>
            </div>
            <div className="max-h-[430px] overflow-y-auto pr-1">
                {loading && <div className="flex min-h-60 items-center justify-center"><Loading/></div>}
                {!loading && error && <div className="rounded-2xl bg-[#ff3b30]/10 px-4 py-8 text-center text-sm text-[#ff3b30]">{error}</div>}
                {!loading && !error && <ImagesList article={article} articleId={article.id} onImageSelected={onImageSelected}/>}
            </div>
        </div>
    );
};

export default LocalTab;
