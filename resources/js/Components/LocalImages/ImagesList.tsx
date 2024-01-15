import React from 'react';
import ImageItem from "@/Components/LocalImages/ImageItem";
import {Image} from "@/types";
import useToggleModal from "@/Hooks/useToggleModal";
import {useActions} from "@/Hooks/useActions";

interface ImagesListProps {
    images: Image[],
    handleDialog: () => void
}

const ImagesList = ({images, handleDialog}: ImagesListProps) => {
    const {setBackgroundImage} = useActions()


    const handleSelectImage = (image: Image) => {
        setBackgroundImage({image})
        handleDialog()
    }
    return (
        <div className="overflow-y-scroll grid gap-x-3 gap-y-3 grid-cols-5 h-96">
            {images.map(image =>
                <ImageItem key={image.id}
                           image={image}
                           selectImage={()=>handleSelectImage(image)}
                />
            )}
        </div>
    );
};

export default ImagesList;
