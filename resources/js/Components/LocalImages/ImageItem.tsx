import React from 'react';
import TagsList from '@/Components/LocalImages/TagsList';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectImageById} from '@/Store/image/image.slice';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@/Store/store';
import {setBackgroundImage} from '@/Store/article/article.slice';

interface ImageItemProps {
    imageId: number
    articleId: number
    onImageSelected: () => void
}

const ImageItem = ({imageId, articleId, onImageSelected}: ImageItemProps) => {
    const image = useTypedSelector(state => selectImageById(state, imageId));
    const dispatch = useDispatch<AppDispatch>();
    const selectImage = async () => {
        await dispatch(setBackgroundImage({article_id: articleId, image_id: imageId})).unwrap();
        onImageSelected();
    };

    if (!image) return null;

    return (
        <button type="button" onClick={selectImage} className="liquid-media-tile group flex h-full flex-col items-stretch justify-start overflow-hidden rounded-[20px] text-left ring-[#2878ff] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
            <ImageWithLoader src={image.thumbnailUrl} alt={image.tags?.map(tag => tag.title).join(', ') || 'Imagine'} loading="lazy" decoding="async" containerClassName="aspect-[4/3] w-full shrink-0" className="h-full w-full object-cover"/>
            {image.tags?.length > 0 && <div className="flex min-w-0 flex-wrap content-start gap-1.5 p-2.5"><TagsList tags={image.tags}/></div>}
        </button>
    );
};

export default ImageItem;
