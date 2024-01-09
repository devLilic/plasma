import React, {useContext} from 'react';
import ImagesContext from "@/Store/LocalImagesStore/images-context";
import {Button, Input, TabPanel} from "@material-tailwind/react";
import Loading from "@/Components/UI/Svg/Loading";
import 'react-image-crop/dist/ReactCrop.css';
import CropBlock from "@/Shared/Dialogs/ImageEditor/Crop/CropBlock";
import ExternalImagesList from "@/Components/ExternalImages/ExternalImagesList";

const GoogleTab = (props) => {
    const imagesCtx = useContext(ImagesContext);

    const setImage = () => {
        imagesCtx.cropImage()
        props.hideDialog();
    }

    return (
        <TabPanel key='external' value='external' className='w-full'>
            {imagesCtx.external.error && <div
                className='w-full h-96 flex justify-center items-center uppercase text-4xl text-red-500 font-bold'>{imagesCtx.external.error}</div>}

            {imagesCtx.external.loading && <div className='h-96 flex justify-center'>
                <Loading/>
            </div>}
            {!imagesCtx.external.error && !imagesCtx.external.loading && <div>
                <h2 className='text-xl text-gray-900 py-2 text-center'>
                    Rezultate pentru "{imagesCtx.external.query}"
                </h2>
                <div className='flex w-full items-start justify-between'>

                    <ExternalImagesList selectExternalImage={imagesCtx.selectExternalImage}/>

                    <div className='w-4/12'>
                        <div className='mx-2'>

                            {imagesCtx.external.selected.croppedUrl?.url && <div>
                                <img src={imagesCtx.external.selected.croppedUrl?.url}/>
                            </div>}

                            {imagesCtx.external.selected.loading ?
                                (<div className='h-56 flex justify-center'>
                                    <Loading/>
                                </div>) :
                                (!imagesCtx.external.selected.croppedUrl?.url &&
                                    imagesCtx.external.selected.url &&
                                    <CropBlock image={imagesCtx.external.selected}
                                               handleCrop={imagesCtx.setCropSection}/>)}

                        </div>
                        <div className='w-full'>
                            {imagesCtx.external.selected.url &&
                                (<div className='px-2 mt-2 flex justify-between items-center'>
                                    <div>
                                        <Button size='sm' onClick={setImage}>Set</Button>
                                    </div>
                                    <div className='w-7/12'>
                                        <Input label='Tags' className='text-xs '/>
                                    </div>
                                    <div>
                                        <Button size='sm'>Save</Button>
                                    </div>
                                </div>)}
                        </div>
                    </div>
                </div>
            </div>}
        </TabPanel>
    );
};

export default GoogleTab;
