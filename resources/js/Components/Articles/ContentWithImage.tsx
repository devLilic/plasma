import React from 'react';
import {useActions} from "@/Hooks/useActions";
import {Image} from "@/types";
import {XMarkIcon} from "@heroicons/react/24/outline";

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
        <div className='relative min-h-0 flex-1 bg-[#f2f2f7]'>
            <img src={image.url} className='h-full w-full object-cover' alt="Imagine selectată"/>
            <button
                className='absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-[#ff3b30]'
                onClick={handleRemoveBackground}
                aria-label="Elimină imaginea"
            ><XMarkIcon className="h-4 w-4"/>
            </button>
        </div>
    );
};

export default ContentWithImage;
