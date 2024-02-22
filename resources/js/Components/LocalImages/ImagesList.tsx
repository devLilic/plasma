import React from 'react';
import ImageItem from "@/Components/LocalImages/ImageItem";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectImagesIds} from "@/Store/image/image.slice";

interface ImagesListProps {
    handleDialog: () => void
}

const ImagesList = ({handleDialog}: ImagesListProps) => {
    const imagesIds = useTypedSelector(selectImagesIds);

    const noImages = <h2 className='font-bold text-red-500 text-center'>Nu exista imagini pentru aceasta cautare</h2>

    const imagesList = <div className="overflow-y-scroll grid gap-x-3 gap-y-4 grid-cols-6 ">
        {imagesIds.map(imageId =>
            <ImageItem key={imageId}
                       imageId={imageId}
                       handleDialog={handleDialog}
            />
        )}</div>

    return imagesIds.length ? imagesList : noImages
};

export default ImagesList;
