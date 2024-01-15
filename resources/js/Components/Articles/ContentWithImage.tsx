import React, {MouseEventHandler} from 'react';

interface IContentWithImageProps {
    wallpaper: string,
    removeBackground: () => void
}

const ContentWithImage = ({wallpaper, removeBackground}: IContentWithImageProps) => {
    return (
        <div className='relative'>
            <img src={wallpaper} className='w-full'/>
            <button
                className='absolute right-1 bottom-1 text-xs text-white border border-transparent hover:border-white hover:bg-red-800 rounded px-1 py-1'
                onClick={removeBackground}
            >Remove image
            </button>
        </div>
    );
};

export default ContentWithImage;
