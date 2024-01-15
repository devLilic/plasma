import React from 'react';
import {Image} from "@/types";
import Loading from "@/Components/UI/Svg/Loading";
import ImagesList from "@/Components/LocalImages/ImagesList";

interface LocalImagesProps {
    images: Image[],
    handleModal: () => void
    isLoading: boolean
}

const LocalImages = ({images, handleModal, isLoading}: LocalImagesProps) => {
    return (
        <div className='px-2'>
            {images.length && (<>
                {isLoading ? <Loading/> : <ImagesList images={images} handleDialog={handleModal}/>}
            </>)}
        </div>
    );
};

export default LocalImages;
