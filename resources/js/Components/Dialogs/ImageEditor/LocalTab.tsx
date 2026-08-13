import React, {useEffect, useState} from 'react';
import {MagnifyingGlassIcon} from '@heroicons/react/24/outline';
import ImagesList from '@/Components/LocalImages/ImagesList';
import {useActions} from '@/Hooks/useActions';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import Loading from '@/Components/UI/Svg/Loading';

interface LocalTabProps {
    handleModal: () => void
}

const LocalTab = ({handleModal}: LocalTabProps) => {
    const [searchTag, setSearchTag] = useState('');
    const loading = useTypedSelector(state => state.images.loading);
    const error = useTypedSelector(state => state.images.error);
    const {fetchImages, searchImages} = useActions();

    useEffect(() => {
        const timer = setTimeout(() => searchTag.length > 1 ? searchImages(searchTag) : fetchImages(100), 500);
        return () => clearTimeout(timer);
    }, [searchTag]);

    return (
        <div>
            <div className="relative mx-auto mb-5 max-w-md">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#8e8e93]"/>
                <input className="ios-search" value={searchTag} onChange={event => setSearchTag(event.target.value)} placeholder="Caută după etichetă"/>
            </div>
            <div className="max-h-[430px] overflow-y-auto pr-1">
                {loading && <div className="flex min-h-60 items-center justify-center"><Loading/></div>}
                {!loading && error && <div className="rounded-2xl bg-[#ff3b30]/10 px-4 py-8 text-center text-sm text-[#ff3b30]">{error}</div>}
                {!loading && !error && <ImagesList handleDialog={handleModal}/>}
            </div>
        </div>
    );
};

export default LocalTab;
