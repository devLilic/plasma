import React from 'react';
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectImageById} from "@/Store/image/image.slice";
import {useActions} from "@/Hooks/useActions";

interface IContentWithImageProps {
    imageId: number,
    articleId: number
}

const ContentWithImage = ({articleId, imageId}: IContentWithImageProps) => {
    const image = useTypedSelector(state => selectImageById(state, imageId))
    const {removeBackground} = useActions()

    const handleRemoveBackground = () => {
        removeBackground({id: articleId, changes: {imageId: null}})
    }
    return (
        <div className='relative'>
            <img src={image.url} className='w-full'/>
            <button
                className='absolute right-1 bottom-1 text-xs text-white border border-transparent hover:border-white hover:bg-red-800 rounded px-1 py-1'
                onClick={handleRemoveBackground}
            >Remove image
            </button>
        </div>
    );
};

export default ContentWithImage;
