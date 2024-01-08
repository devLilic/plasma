import React, {MouseEventHandler} from 'react';

interface IContentWithImageProps {
    wallpaper: string,
    removeWallpaper: MouseEventHandler<HTMLButtonElement>
}

const ContentWithImage = ({wallpaper, removeWallpaper}: IContentWithImageProps) => {
    return (
        <div className='relative'>
            <img src={wallpaper} className='w-full'/>
            <button
                className='absolute right-1 bottom-1 text-xs text-white border border-transparent hover:border-white hover:bg-red-800 rounded px-1 py-1'
                onClick={removeWallpaper}
            >Remove image
            </button>
        </div>
    );
};

export default ContentWithImage;
