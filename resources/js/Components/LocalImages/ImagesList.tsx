import React, {useMemo} from 'react';
import {PhotoIcon} from '@heroicons/react/24/outline';
import ImageItem from '@/Components/LocalImages/ImageItem';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllImages} from '@/Store/image/image.slice';
import {selectArticleById} from '@/Store/article/article.slice';
import {rankImagesForArticle} from '@/Utils/imageRelevance';
import {Article} from '@/types';

interface ImagesListProps {
    article?: Article
    articleId?: number
    onImageSelected: () => void
}

const ImagesList = ({article: suppliedArticle, articleId, onImageSelected}: ImagesListProps) => {
    const images = useTypedSelector(selectAllImages);
    const selectedArticle = useTypedSelector(state => selectArticleById(state, state.articles.current));
    const article = suppliedArticle ?? selectedArticle;
    const rankedImages = useMemo(() => rankImagesForArticle(images, article), [images, article]);
    if (!rankedImages.length) {
        return (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <PhotoIcon className="mb-3 h-10 w-10 text-[#c7c7cc]"/>
                <p className="font-semibold text-[#1c1c1e]">Nicio imagine găsită</p>
                <p className="mt-1 text-sm text-[#8e8e93]">Încearcă o altă etichetă sau încarcă o imagine nouă.</p>
            </div>
        );
    }
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{rankedImages.map(image => <ImageItem key={image.id} imageId={image.id} articleId={articleId ?? article?.id ?? 0} onImageSelected={onImageSelected}/>)}</div>;
};

export default ImagesList;
