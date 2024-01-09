import React, {useContext, useEffect, useState} from 'react';
import ImagesContext from "@/Store/LocalImagesStore/images-context";
import {Input, TabPanel} from "@material-tailwind/react";
import LocalImages from "@/Components/LocalImages/LocalImages";

const LocalTab = ({onSelectImage}) => {
    const imagesCtx = useContext(ImagesContext);

    const [searchTag, setSearchTag] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTag !== '') {
                imagesCtx.searchLocalImages(searchTag)
            } else {
                imagesCtx.resetImages()
            }
        }, 1000);
        return () => {
            clearTimeout(timer)
        }
    }, [searchTag])

    const handleSearchTag = event => {
        setSearchTag(event.target.value)
    }

    const localImagesTitle = ((imagesCtx.local.images.length > 0) ?
        (searchTag ? `Rezultate pentru "${searchTag}"` : "Toate imaginile") :
        "Nu am găsit nimic");

    return (
        <TabPanel key='local' value='local' className='w-full'>
            <div className="my-2 w-3/12 mx-auto">
                <Input label='Caută imagini după tag'
                       className="text-center"
                       value={searchTag}
                       onChange={handleSearchTag}
                />
            </div>
            <div className='flex'>
                <div className={imagesCtx.relevant.images.length ? 'w-2/12' : ''}>
                    <LocalImages title='Relevante'
                                 images={imagesCtx.relevant.images}
                                 onSelectImage={onSelectImage}
                                 loading={imagesCtx.relevant.loading}
                                 className='grid-cols-1 h-96'
                    />
                </div>
                <div className={imagesCtx.relevant.images.length ? 'w-10/12' : 'w-full'}>
                    <LocalImages title={localImagesTitle}
                                 images={imagesCtx.local.images}
                                 onSelectImage={onSelectImage}
                                 loading={imagesCtx.local.loading}
                                 className='grid-cols-8 h-96'
                    />
                </div>
            </div>
        </TabPanel>
    );
};

export default LocalTab;
