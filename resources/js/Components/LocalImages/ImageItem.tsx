import React from 'react';
import TagsList from "@/Components/LocalImages/TagsList";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectImageById} from "@/Store/image/image.slice";
import {useActions} from "@/Hooks/useActions";

interface ImageItemProps {
    imageId: number
    handleDialog: () => void
}

const ImageItem = ({imageId, handleDialog}: ImageItemProps) => {
    const image = useTypedSelector(state => selectImageById(state, imageId))
    const currentArticleId = useTypedSelector(state => state.articles.current)
    const {setBackgroundImage, removeImage} = useActions()
    const selectImage = () => {
        setBackgroundImage({article_id: currentArticleId, image_id: imageId})
        handleDialog()
    }
    return (
        <div className='text-center relative'>
            <img src={image.url}
                 onClick={selectImage}
                 className='cursor-pointer mb-1'/>
            <span className='absolute top-1 right-1 border border-white cursor-pointer text-xs px-1 bg-gray-100 opacity-60 hover:opacity-100 rounded hover:bg-red-400 hover:text-white'
                  onClick={() => removeImage(image.id)}
            >X</span>
            {image.tags && <div className='flex flex-wrap justify-center'>
                <TagsList tags={image.tags}/>
            </div>}
        </div>
    );
};

export default ImageItem;
