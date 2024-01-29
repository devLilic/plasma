import React, {useEffect} from 'react';
import {Button, Input} from "@material-tailwind/react";
import Loading from "@/Components/UI/Svg/Loading";
import 'react-image-crop/dist/ReactCrop.css';
// import CropBlock from "@/Shared/Dialogs/ImageEditor/Crop/CropBlock";
import ExternalImagesList from "@/Components/ExternalImages/ExternalImagesList";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";
import CropBlock from "@/Components/Dialogs/ImageEditor/Crop/CropBlock";
import {cropExternalImage} from "@/Store/image/externalImage.slice";

interface GoogleTabProps {
    handleModal: () => void
}

const GoogleTab = ({handleModal}: GoogleTabProps) => {
    const {error, loading} = useTypedSelector(state => state.externalImages)
    const {fetchExternalImages,resetCrop} = useActions()

    const currentArticle = useTypedSelector(state => state.articles.current)

    const selectImageToCrop = useTypedSelector(state => state.externalImages.selected)

    useEffect(() => {
        console.log('current ', currentArticle)
        resetCrop()
    }, [currentArticle]);

    useEffect(() => {
        fetchExternalImages()
    }, []);


    const setImage = () => {

        // cropExternalImage()
        handleModal();
    }

    return (
        <>
            {error && <div
                className='w-full h-96 flex justify-center items-center uppercase text-4xl text-red-500 font-bold'>
                {error}
            </div>}

            {loading && <div className='h-96 flex justify-center'>
                <Loading/>
            </div>}
            {!error && !loading && <div>
                <h2 className='text-xl text-gray-900 py-2 text-center'>
                    Rezultate pentru "..."
                </h2>
                <div className='flex w-full items-start justify-between'>

                    <ExternalImagesList/>

                    <div className='w-4/12'>
                        <div className='mx-2'>
                            {!selectImageToCrop.croppedUrl && selectImageToCrop.url && <CropBlock/>}
                        </div>
                        <div className='w-full'>
                            {selectImageToCrop.url &&
                                (<div className='px-2 mt-2 flex justify-between items-center'>
                                    <div>
                                        <Button placeholder={undefined}
                                                size='sm'
                                                onClick={setImage}>Set</Button>
                                    </div>
                                    <div className='w-7/12'>
                                        <Input crossOrigin={undefined}
                                               label='Tags'
                                               className='text-xs '/>
                                    </div>
                                    <div>
                                        <Button placeholder={undefined}
                                                size='sm'>Save</Button>
                                    </div>
                                </div>)}
                        </div>
                    </div>
                </div>
            </div>}
        </>
    );
};

export default GoogleTab;
