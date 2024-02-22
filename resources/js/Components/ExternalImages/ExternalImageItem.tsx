import React from 'react';
import {ExternalImage} from "@/types";
import ExternalLink from "@/Components/UI/Svg/ExternalLink";

interface ExternalImageItemProps {
    image: ExternalImage,
    selectExternalImage: () => void
}

const ExternalImageItem = ({image, selectExternalImage}: ExternalImageItemProps) => {
    return (
        <div
            className='border border-purple-500 rounded-lg overflow-hidden text-center flex flex-col items-center flex-nowrap relative'>
            <img src={image.url} onClick={selectExternalImage} className='cursor-pointer'/>
            <div className='text-xs'>
                {image.width} x {image.height}
            </div>
            <a href={image.article}
               target='_blank'
               className='absolute top-1 right-1 p-1 rounded block hover:bg-amber-50'
               title={image.site}
            >
                <ExternalLink />
            </a>
        </div>
    );
};

export default ExternalImageItem;
