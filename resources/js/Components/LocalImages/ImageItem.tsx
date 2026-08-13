import React from 'react';
import TagsList from '@/Components/LocalImages/TagsList';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectImageById} from '@/Store/image/image.slice';
import {useActions} from '@/Hooks/useActions';

interface ImageItemProps {
    imageId: number
    handleDialog: () => void
}

const ImageItem = ({imageId, handleDialog}: ImageItemProps) => {
    const image = useTypedSelector(state => selectImageById(state, imageId));
    const articleId = useTypedSelector(state => state.articles.current);
    const {setBackgroundImage} = useActions();
    const selectImage = () => {
        setBackgroundImage({article_id: articleId, image_id: imageId});
        handleDialog();
    };

    return (
        <button type="button" onClick={selectImage} className="group overflow-hidden rounded-2xl bg-[#f2f2f7] text-left ring-[#007aff] transition hover:ring-2 focus:outline-none focus:ring-2">
            <img src={image.url} alt={image.tags?.map(tag => tag.title).join(', ') || 'Imagine'} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"/>
            {image.tags?.length > 0 && <div className="flex flex-wrap gap-1.5 p-2.5"><TagsList tags={image.tags}/></div>}
        </button>
    );
};

export default ImageItem;
