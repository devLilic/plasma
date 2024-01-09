import React, {useContext} from 'react';
import ImagesContext from "@/Store/LocalImagesStore/images-context";
import {TabPanel} from "@material-tailwind/react";

const SuggestedTab = ({onSelectImage}) => {
    const imagesCtx = useContext(ImagesContext);

    const localImagesList = imagesCtx.images.map(image => <div className='text-center' key={image.id}>
        <img src={image.url} onClick={onSelectImage.bind(null, image.url)} className='cursor-pointer'/>
        {image.tags.map(tag => <span key={tag.id}
            className='px-2 text-xs text-gray-800 bg-yellow-100 m-1 border border-yellow-500 rounded'>{tag.title}</span>)}
    </div>)

    return (
        <TabPanel key='suggested' value='suggested' className='w-full'>
            <div className="grid grid-cols-8 grid-rows-3 gap-y-3 gap-x-3">
                {localImagesList}
            </div>
        </TabPanel>
    );
};

export default SuggestedTab;
