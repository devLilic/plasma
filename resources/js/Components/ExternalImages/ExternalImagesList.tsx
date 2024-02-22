import React, {FC, useEffect} from 'react';
import {Button} from "@material-tailwind/react";
import ExternalImageItem from "@/Components/ExternalImages/ExternalImageItem";
import {selectAllExternalImages} from "@/Store/image/externalImage.slice";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";

const ExternalImagesList: FC = () => {
    const images = useTypedSelector(selectAllExternalImages)
    const {selectExternalImage} = useActions()
    const loadMore = ()=> {}

    return (
        <div className='overflow-y-scroll pr-2 h-96'>
            <div className="grid grid-cols-3 border grid-rows-3 gap-y-1 gap-x-1">
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
