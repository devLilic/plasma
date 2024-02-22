import React from 'react';
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectImageById} from "@/Store/image/image.slice";
import {useActions} from "@/Hooks/useActions";
import {Image} from "@/types";

interface IContentWithImageProps {
    image: Image,
    articleId: number
}

const ContentWithImage = ({articleId, image}: IContentWithImageProps) => {
    const {removeBackgroundImage} = useActions()

    const handleRemoveBackground = () => {
        removeBackgroundImage({article_id: articleId})
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
