import React, {ChangeEvent, useEffect, useState} from 'react';
import {Button, Input} from "@material-tailwind/react";
import Loading from "@/Components/UI/Svg/Loading";
import 'react-image-crop/dist/ReactCrop.css';
import ExternalImagesList from "@/Components/ExternalImages/ExternalImagesList";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";
import CropBlock from "@/Components/Dialogs/ImageEditor/Crop/CropBlock";
import {PercentCrop} from "react-image-crop";

interface GoogleTabProps {
    handleModal: () => void
}

const GoogleTab = ({handleModal}: GoogleTabProps) => {
    const [tags, setTags] = useState<string>('')

    const {cropExternalImage} = useActions()
    const {error, loading} = useTypedSelector(state => state.externalImages)
    const {
        fetchExternalImages,
        resetCrop,
        setExternalUrlLink,
        changeQuery
    } = useActions()

    const cropImage = useTypedSelector(state => state.externalImages.selected)
    const currentArticleId = useTypedSelector(state => state.articles.current)
    const currentArticle = useTypedSelector(state => state.articles.entities[state.articles.current][state.articles.search_by ? state.articles.search_by : 'title'])
    const selectImageToCrop = useTypedSelector(state => state.externalImages.selected)
    const externalUrl = useTypedSelector(state => state.externalImages.selected.url)
    const externalQuery = useTypedSelector(state => state.externalImages.query)

    const [percentCrop, setPercentCrop] = useState<PercentCrop>({
        unit: "%",
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });


    useEffect(() => {
        resetCrop()
    }, [currentArticle]);

    useEffect(() => {
        let query_words = currentArticle.split(' ').filter(word => word.length > 2).join(' ')
        changeQuery(query_words);
        fetchExternalImages(query_words)
    }, []);

    const handleExternalUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        setExternalUrlLink(e.target.value)
    }

    const onPercentCropChange = (percentCrop: PercentCrop) => {
        setPercentCrop(percentCrop)
    }

    const onCropImageBtnClick = () => {
        cropExternalImage({url: cropImage.url, section: percentCrop, tags, article_id: currentArticleId})
        handleModal()
    }

    const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTags(e.target.value)
    }

    const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
        changeQuery(e.target.value)
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
                    Rezultate pentru "{externalQuery}"
                </h2>
                <div className='flex items-start justify-between'>
                    <div className='w-7/12 flex flex-wrap mr-2 '>
                        <div className='flex flex-1 mb-2'>
                            <Input crossOrigin={undefined}
                                   value={externalQuery}
                                   label="Căutare"
                                   onChange={handleQueryChange}
                            />
                            <Button color='purple'
                                    placeholder={null}
                                    className='ml-2'>Caută</Button>
                        </div>

                        <div className='w-full'>
                            <ExternalImagesList/>
                        </div>
                    </div>

                    <div className='w-5/12'>
                        <div className='flex justify-between items-center pb-2'>
                            <Input
                                className="py-0"
                                label='URL'
                                crossOrigin={undefined}
                                value={externalUrl}
                                onChange={handleExternalUrlChange}
                            />
                        </div>
                        <div className='mx-2'>
                            {
                                !selectImageToCrop.croppedUrl &&
                                selectImageToCrop.url &&
                                <CropBlock url={cropImage.url}
                                           handlePercentCropChange={onPercentCropChange}/>
                            }
                        </div>
                        <div className='w-full'>
                            {selectImageToCrop.url &&
                                (<div className='px-2 mt-2 flex justify-between items-center'>
                                    <div className='w-7/12'>
                                        <Input crossOrigin={undefined}
                                               label='Tags'
                                               className='text-xs'
                                               value={tags}
                                               onChange={handleTagsChange}
                                        />
                                    </div>
                                    <div>
                                        <Button placeholder={undefined}
                                                size='sm'
                                                onClick={onCropImageBtnClick}
                                        >Save</Button>
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
