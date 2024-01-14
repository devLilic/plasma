import React, {ChangeEvent, useState} from 'react';
import {Input} from "@material-tailwind/react";
import {useGetImagesQuery} from "@/Store/image/image.api";
import LocalImages from "@/Components/LocalImages/LocalImages";

const LocalTab = () => {
    const {data, isLoading, error} = useGetImagesQuery(0)

    const [searchTag, setSearchTag] = useState('')

    const handleSearchTag = (e: ChangeEvent<HTMLInputElement>) => setSearchTag(prevState => e.target.value)


    const localImages = data ? (<LocalImages images={data} isLoading={isLoading}/>) : "";

    return (
        <>
            <div className="mb-6 w-4/12 mx-auto">
                <Input label='Caută imagini după tag'
                       value={searchTag}
                       onChange={handleSearchTag}
                />
            </div>
            <div className='flex'>
                {/*<div className={imagesCtx.relevant.images.length ? 'w-2/12' : ''}>*/}
                {/*    <LocalImages title='Relevante'*/}
                {/*                 images={imagesCtx.relevant.images}*/}
                {/*                 onSelectImage={onSelectImage}*/}
                {/*                 loading={imagesCtx.relevant.loading}*/}
                {/*                 className='grid-cols-1 h-96'*/}
                {/*    />*/}
                {/*</div>*/}
                <div className="w-full">
                    {localImages}
                </div>
                {/*    <LocalImages title={localImagesTitle}*/}
                {/*                 images={imagesCtx.local.images}*/}
                {/*                 onSelectImage={onSelectImage}*/}
                {/*                 loading={imagesCtx.local.loading}*/}
                {/*                 className='grid-cols-8 h-96'*/}
                {/*    />*/}
                {/*</div>*/}
            </div>
        </>
    );
};

export default LocalTab;
