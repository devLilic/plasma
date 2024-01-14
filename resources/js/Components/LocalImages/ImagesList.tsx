import React from 'react';
import ImageItem from "@/Components/LocalImages/ImageItem";
import {Image} from "@/types";

interface ImagesListProps {
    images: Image[],
    // onSelectImage: () => void
}

const handleSelectImage = (imageId: number) => {
    console.log(imageId)
}

const ImagesList = ({images}: ImagesListProps) => {
    return (
        <div className="overflow-y-scroll grid gap-x-3 gap-y-3 grid-cols-5 h-96">
            {images.map(image =>
                <ImageItem key={image.id}
                           image={image}
                           selectImage={()=>handleSelectImage(image.id)}
                />
            )}
        </div>
    );
};

export default ImagesList;
