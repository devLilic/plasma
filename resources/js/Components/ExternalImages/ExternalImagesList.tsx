import React, {useEffect} from 'react';
import {Button} from "@material-tailwind/react";
import ExternalImageItem from "@/Components/ExternalImages/ExternalImageItem";
import {selectAllExternalImages} from "@/Store/image/externalImage.slice";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";

const ExternalImagesList = () => {
    const images = useTypedSelector(selectAllExternalImages)
    const {selectExternalImage} = useActions()
    const loadMore = ()=> {}

    return (
        <div className='w-7/12 overflow-y-scroll pr-2 h-96'>
            <div className="grid grid-cols-5 grid-rows-3 gap-y-3 gap-x-3">
                {images && images.map(
                    image => <ExternalImageItem
                        key={image.id}
                        image={image}
                        selectExternalImage={() => selectExternalImage({url: image.url})}/>
                )}
                <Button
                    placeholder={undefined}
                    className='bg-transparent border border-purple-500 text-purple-800 hover:text-white hover:bg-purple-400'
                    onClick={loadMore}
                >Load more</Button>
            </div>
        </div>
    );
};

export default ExternalImagesList;
