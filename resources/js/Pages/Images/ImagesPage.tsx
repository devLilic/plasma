import React, {ChangeEvent, useEffect, useState} from 'react';
import {Head} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Image, PageProps} from "@/types";
import {Button, Card, Input} from "@material-tailwind/react";
import {useActions} from "@/Hooks/useActions";
import TagsList from "@/Components/LocalImages/TagsList";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectAllImages} from "@/Store/image/image.slice";
import {saveAs} from "file-saver";

interface ImagesPageProps extends PageProps {
    images: Image[]
}

const ImagesPage = ({auth, images}: ImagesPageProps) => {
    const [searchTag, setSearchTag] = useState('')
    const renderImages = useTypedSelector(selectAllImages);
    const {setImages} = useActions()
    const {fetchImages, searchImages} = useActions()

    useEffect(() => {
        setImages(images)
    }, []);

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

    const handleSearchTag = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTag(e.target.value)
    }

    const handleClickSaveImageBtn = (image: Image) => {
        let fileName = '';
        if (searchTag !== '') {
            fileName = `_${searchTag}`
        } else if (image.tags.length) {
            fileName = image.tags.reduce((acc, current) => `${acc}_${current.title}`, '')
        } else {
            fileName = `_${image.id}_autosave`
        }
        saveAs(`${image.url}`, `${fileName}.jpg`)
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Playlist"/>
            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1" placeholder={undefined}>
                    <div className='my-4 mx-4'>
                        <div className="mb-5 w-4/12 mx-auto">
                            <Input label='Caută imagini după tag'
                                   value={searchTag}
                                   onChange={handleSearchTag}
                                   crossOrigin={undefined}/>
                        </div>
                        <div className="overflow-y-scroll grid gap-x-3 gap-y-4 grid-cols-5 ">
                            {renderImages.map(image =>
                                <div className='text-center relative' key={image.id}>
                                    <img src={image.url}
                                         className='cursor-pointer mb-1'/>

                                    <Button
                                        className='px-2 py-1 !absolute top-2 right-2 bg-red-300 border border-red-800 hover:bg-red-800'
                                        placeholder={null}
                                        onClick={() => handleClickSaveImageBtn(image)}
                                    >Save</Button>

                                    {image.tags && <div className='flex flex-wrap justify-center'>
                                        <TagsList tags={image.tags}/>
                                    </div>}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

        </AuthenticatedLayout>
    );
};

export default ImagesPage;
