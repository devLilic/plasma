import React from 'react';
import {Image} from "@/types";
import Loading from "@/Components/UI/Svg/Loading";
import ImagesList from "@/Components/LocalImages/ImagesList";

interface LocalImagesProps {
    images: Image[],
    isLoading: boolean
}

const LocalImages = ({images, isLoading}: LocalImagesProps) => {
    return (
        <div className='px-2'>
            {images.length && (<>
                {isLoading ? <Loading /> :
                    <ImagesList images={images}/>}
            </>)}
        </div>
    );
};

export default LocalImages;
