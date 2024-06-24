import React, {ChangeEvent, useEffect, useState} from 'react';
import {Button, Checkbox, Input} from "@material-tailwind/react";
import Loading from "@/Components/UI/Svg/Loading";
import 'react-image-crop/dist/ReactCrop.css';
import ExternalImagesList from "@/Components/ExternalImages/ExternalImagesList";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";
import CropBlock from "@/Components/Dialogs/ImageEditor/Crop/CropBlock";
import {PercentCrop} from "react-image-crop";
import SearchExternalImages from "@/Components/ExternalImages/SearchExternalImages";

interface GoogleTabProps {
    handleModal: () => void
}

const GoogleTab = ({handleModal}: GoogleTabProps) => {

    const {cropExternalImage} = useActions()
    const {error, loading} = useTypedSelector(state => state.externalImages)
    const {
        // fetchExternalImages,
        resetCrop,
        setExternalUrlLink,
        changeQuery,
        changeSearchBy,
        changeTitle,
        changeSubtitle
    } = useActions()

    const cropImage = useTypedSelector(state => state.externalImages.selected)
    const currentArticleId = useTypedSelector(state => state.articles.current)
    const currentArticleSearchBy = useTypedSelector(state => state.articles.entities[state.articles.current][state.articles.search_by ? state.articles.search_by : 'title'])
    const article = useTypedSelector(state => state.articles.entities[currentArticleId])
    const selectImageToCrop = useTypedSelector(state => state.externalImages.selected)
    const externalUrl = useTypedSelector(state => state.externalImages.selected.url)
    // const externalQuery = useTypedSelector(state => state.externalImages.query)
    const query = article.search_by === "title" ? article.title : article.subtitle

    const subtitle = article.subtitle.replace(new RegExp(/\s?off|\s?snc/, "gi"), "");
    const [tags, setTags] = useState<string>(subtitle.toLowerCase())


    const [percentCrop, setPercentCrop] = useState<PercentCrop>({
        unit: "%",
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });


    useEffect(() => {
        resetCrop()
    }, [currentArticleSearchBy]);

    useEffect(() => {
        let query_words = currentArticleSearchBy.split(' ').filter(word => word.length > 2).join(' ')
        changeQuery(query_words);
        // fetchExternalImages(query_words)
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

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        changeTitle({id: article.id, changes: {title: e.target.value}})
    }
    const handleSubtitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        changeSubtitle({id: article.id, changes: {subtitle: e.target.value}})
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
                    {article.block_title}
                </h2>

                <div className='flex items-start justify-between'>
                    <div className='w-6/12 flex flex-wrap mr-2 '>
                        {
                            !selectImageToCrop.croppedUrl && selectImageToCrop.url ?
                                <div className='mx-2 max-h-auto max-w-[500px]'>
                                    {
                                        !selectImageToCrop.croppedUrl &&
                                        selectImageToCrop.url &&
                                        <CropBlock url={cropImage.url}
                                                   handlePercentCropChange={onPercentCropChange}/>
                                    }
                                </div> :
                                <>
                                    <div className="inline-flex w-full pr-4">
                                        <Checkbox
                                            label={article.search_by !== "title" ? article.title : ''}
                                            checked={article.search_by === "title"}
                                            color='purple'
                                            crossOrigin={undefined}
                                            onChange={() => {
                                                changeSearchBy({id: article.id, changes: {search_by: "title"}})
                                            }}/>
                                        {article.search_by === "title" && <Input type="text"
                                                                                 color="purple"
                                                                                 label="Titlu"
                                                                                 className="w-full text-xs"
                                                                                 value={article.title}
                                                                                 crossOrigin={undefined}
                                                                                 onChange={handleTitleChange}/>
                                        }

                                    </div>
                                    <div className="inline-flex w-full mt-6 pr-4">
                                        <Checkbox label={article.search_by !== "subtitle" ? article.subtitle : ''}
                                                  checked={article.search_by === "subtitle"}
                                                  color="purple"
                                                  onChange={() => {
                                                      changeSearchBy({id: article.id, changes: {search_by: "subtitle"}})
                                                  }}
                                                  crossOrigin={undefined}/>
                                        {article.search_by === "subtitle" && <Input type="text"
                                                                                    color="purple"
                                                                                    label="Subtitlu"
                                                                                    className="w-full text-xs"
                                                                                    value={article.subtitle}
                                                                                    crossOrigin={undefined}
                                                                                    onChange={handleSubtitleChange}/>
                                        }
                                    </div>
                                    <div className='w-[150px] flex justify-around mx-auto mt-5'>
                                        <SearchExternalImages query={query}/>
                                    </div>
                                </>
                        }
                        {/*    <div className='flex flex-1 mb-2'>*/}
                        {/*        <Input crossOrigin={undefined}*/}
                        {/*               value={externalQuery}*/}
                        {/*               label="Căutare"*/}
                        {/*               onChange={handleQueryChange}*/}
                        {/*        />*/}
                        {/*        <Button color='purple'*/}
                        {/*                placeholder={null}*/}
                        {/*                className='ml-2'>Caută</Button>*/}
                        {/*    </div>*/}

                        {/*    <div className='w-full'>*/}
                        {/*        <ExternalImagesList/>*/}
                        {/*    </div>*/}
                    </div>

                    <div className='w-6/12 min-h-[200px] flex flex-col justify-between items-center pt-3'>
                        <Input
                            className="py-0 pb-2"
                            variant='standard'
                            label='URL'
                            color='purple'
                            crossOrigin={undefined}
                            value={externalUrl}
                            onChange={handleExternalUrlChange}
                            autoFocus={true}
                        />
                        {selectImageToCrop.url &&
                            <>
                                <div className='w-full'>
                                    <Input crossOrigin={undefined}
                                           variant='standard'
                                           label='Tags'
                                           className=''
                                           color='purple'
                                           value={tags}
                                           onChange={handleTagsChange}
                                    />
                                </div>
                                <div>
                                    <Button placeholder={undefined}
                                            className='py-3'
                                            color='purple'
                                            size='sm'
                                            onClick={onCropImageBtnClick}
                                    >Save</Button>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div>}
        </>
    );
};

export default GoogleTab;
