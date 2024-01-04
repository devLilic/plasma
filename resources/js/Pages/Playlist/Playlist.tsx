import React, {ChangeEvent, useEffect, useState} from 'react';
import UploadButton from "@/Components/UI/UploadButton/UploadButton";
import {Head, useForm} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {PageProps} from "@/types";
import {Card, List} from "@material-tailwind/react";
import ListOfPlaylists from "@/Components/Playlist/ListOfPlaylists";

const Playlist = ({auth}: PageProps) => {
    const [isFileTypeOK, setIsFileTypeOK] = useState(false);
    const {data, setData, post} = useForm({
        file: {},
    });

    // useEffect(() => {
    //     if (isFileTypeOK) {
    //         post('titles', data);
    //     }
    // }, [isFileTypeOK])

    function handleChange(e: ChangeEvent<HTMLFormElement>) {
        // check if uploaded file is of type HTML
        const typeOK = e.target.files[0].type === 'text/html'
        setData("file", e.target.files[0]);
        setIsFileTypeOK(typeOK)
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Playlist"/>

            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1">
                    <form>
                        <div className="flex flex-col w-full h-48 items-center justify-center bg-grey-lighter">
                            <UploadButton title="Încarcă playlist" handleChange={handleChange}/>
                            <div>
                                {!isFileTypeOK && <div className='mt-5'>Fișier HTML</div>}
                            </div>
                        </div>
                    </form>
                </Card>
                <Card className='flex w-3/4 ml-2 items-center'>
                    <ListOfPlaylists />
                </Card>
            </div>

        </AuthenticatedLayout>

    );
};

export default Playlist;
