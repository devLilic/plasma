import React from 'react';
import ImageItem from "@/Components/LocalImages/ImageItem";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectImagesIds} from "@/Store/image/image.slice";

interface ImagesListProps {
    handleDialog: () => void
}

const ImagesList = ({handleDialog}: ImagesListProps) => {
    const imagesIds = useTypedSelector(selectImagesIds);

    return (
        <div className="overflow-y-scroll grid gap-x-3 gap-y-4 grid-cols-6 ">
            {imagesIds.map(imageId =>
                <ImageItem key={imageId}
                           imageId={imageId}
                           handleDialog={handleDialog}
                />
            )}
        </div>
    );
};

export default ImagesList;
