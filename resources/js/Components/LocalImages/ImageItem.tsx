import React from 'react';
import TagsList from "@/Components/LocalImages/TagsList";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectImageById} from "@/Store/image/image.slice";
import {useActions} from "@/Hooks/useActions";
import {selectArticleById} from "@/Store/article/article.slice";

interface ImageItemProps {
    imageId: number
    handleDialog: () => void
}

const ImageItem = ({imageId, handleDialog}: ImageItemProps) => {
    const image = useTypedSelector(state => selectImageById(state, imageId))
    const currentArticleId = useTypedSelector(state => state.articles.current)
    const {setBackgroundImage} = useActions()
    const selectImage = () => {
        setBackgroundImage({id: currentArticleId, changes: {image}})
        handleDialog()
    }
    return (
        <div className='text-center'>
            <img src={image.url}
                 onClick={selectImage}
                 className='cursor-pointer mb-1'/>
            {image.tags && <div className='flex flex-wrap justify-center'>
                <TagsList tags={image.tags}/>
            </div>}
        </div>
    );
};

export default ImageItem;
