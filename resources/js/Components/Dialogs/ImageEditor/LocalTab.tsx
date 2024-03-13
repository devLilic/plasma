import React, {ChangeEvent, useEffect, useState} from 'react';
// import {Input} from "@material-tailwind/react";
import ImagesList from "@/Components/LocalImages/ImagesList";
import {useActions} from "@/Hooks/useActions";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import Loading from "@/Components/UI/Svg/Loading";
import Input from "@/Components/Material/Input";

interface LocalTabProps {
    handleModal: () => void
}

const LocalTab = ({handleModal}: LocalTabProps) => {
    const [searchTag, setSearchTag] = useState('')
    const loading = useTypedSelector(state => state.images.loading)
    const error = useTypedSelector(state => state.images.error)

    const {fetchImages, searchImages} = useActions()

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
        setSearchTag(prevState => e.target.value)
    }

    return (
        <>
            <div className="mb-5 w-4/12 mx-auto">
                <Input label='Caută imagini după tag'
                       value={searchTag}
                       onChange={handleSearchTag}/>
            </div>
            <div className='flex max-h-[430px] overflow-y-scroll'>
                <div className="w-full">
                    {loading && <Loading/>}
                    {!loading && error !== '' && <h2>{error}</h2>}
                    {!loading && error === '' && <ImagesList handleDialog={handleModal}/>}
                </div>
            </div>
        </>
    );
};

export default LocalTab;
