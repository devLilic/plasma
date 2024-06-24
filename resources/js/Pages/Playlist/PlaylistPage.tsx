import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import UploadButton from "@/Components/UI/UploadButton/UploadButton";
import {Head, useForm} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Article, Image, PageProps, Playlist} from "@/types";
import {Button, Card, Input} from "@material-tailwind/react";
import ListOfPlaylists from "@/Components/Playlist/ListOfPlaylists";
import {useActions} from "@/Hooks/useActions";
import TagsList from "@/Components/LocalImages/TagsList";
import {saveAs} from "file-saver";
import {fetchImages, searchImages, selectAllImages} from "@/Store/image/image.slice";
import {useTypedSelector} from "@/Hooks/useTypedSelector";

interface PlaylistPageProps extends PageProps {
    playlists?: Playlist[]
    articles?: Article[]
    images: Image[]
}

const PlaylistPage = ({auth, playlists, articles, images}: PlaylistPageProps) => {
    const [searchTag, setSearchTag] = useState('')
    const renderImages = useTypedSelector(selectAllImages);

    const [isFileTypeOK, setIsFileTypeOK] = useState(false);
    const {setArticles, setImages, fetchImages, searchImages} = useActions()
    const {data, setData, post} = useForm({
        file: {},
    });

    useEffect(() => {
        if (articles) {
            setArticles(articles)
        }
        if (images) {
            setImages(images)
        }
    }, []);

    useEffect(() => {
        if (isFileTypeOK) {
            post('playlists');
        }
    }, [isFileTypeOK])

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        // check if uploaded file is of type HTML
        if (e.target.files) {
            const typeOK = e.target.files[0].type === 'text/html'
            setData("file", e.target.files[0]);
            setIsFileTypeOK(typeOK)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTag.length > 1) {
                searchImages(searchTag)
            } else {
                fetchImages()
            }
        }, 1000);
        return () => {
            clearTimeout(timer)
        }
    }, [searchTag])

    const handleClickSaveImageBtn = (image: Image) => {
        let fileName = '';
        if (searchTag !== '') {
            fileName = `_${searchTag}`
        } else if (image.tags.length) {
            fileName = image.tags.reduce((acc, current) => `${acc}_${current.title}`, '')
        } else {
            fileName = `_${image.id}_autosave`
        }
        setSearchTag('')
        saveAs(`${image.url}`, `${fileName}.jpg`)
    }

    const handleSearchTag = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTag(e.target.value)
    }


    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Playlist"/>

            <div className="flex gap-2 flex-row items-start">
                <div className='w-full'>
                    <Card placeholder={undefined} className='p-2'>
                        <div className="w-1/2 mx-auto">
                            <Input label='Caută imagini după tag'
                                   className='text-center'
                                   value={searchTag}
                                   onChange={handleSearchTag}
                                   crossOrigin={undefined}/>
                        </div>
                        <div className='flex flex-wrap'>
                            {renderImages.map(image =>
                                <div className='w-1/4 p-2 text-center relative' key={image.id}>
                                    <img src={image.url}
                                         className='cursor-pointer mb-1'/>

                                    <Button
                                        className='px-2 py-1 !absolute top-3 right-3 bg-red-300 border border-red-800 hover:bg-red-800'
                                        placeholder={null}
                                        onClick={() => handleClickSaveImageBtn(image)}
                                    >Save</Button>

                                    {image.tags && <div className='flex flex-wrap justify-center'>
                                        <TagsList tags={image.tags}/>
                                    </div>}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                <div className='flex flex-col border w-1/2'>
                    <Card className='mb-2' placeholder={undefined}>
                        <form>
                            <div className="flex flex-col w-full h-24 items-center justify-center bg-grey-lighter">
                                <UploadButton title="Încarcă playlist (xTELEJURNAL.HTM)" handleChange={handleChange}/>
                            </div>
                        </form>
                    </Card>
                    <Card className='w-full flex items-center' placeholder={undefined}>
                        <ListOfPlaylists playlists={playlists}/>
                    </Card>
                </div>
            </div>

        </AuthenticatedLayout>
    );
};

export default PlaylistPage
