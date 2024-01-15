import React from 'react';
import TagsList from "@/Components/LocalImages/TagsList";
import {Image} from "@/types";
import {useActions} from "@/Hooks/useActions";

interface ImageItemProps {
    image: Image
    selectImage: () => void
}

const ImageItem = ({image, selectImage}: ImageItemProps) => {
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
