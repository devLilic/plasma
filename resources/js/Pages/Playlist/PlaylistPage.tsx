import React, {ChangeEvent, useEffect, useState} from 'react';
import UploadButton from "@/Components/UI/UploadButton/UploadButton";
import {Head, useForm} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {PageProps, Playlist, User} from "@/types";
import {Card, List} from "@material-tailwind/react";
import ListOfPlaylists from "@/Components/Playlist/ListOfPlaylists";

interface PlaylistPageProps{
    auth: {
        user: User
    }
    playlists: Playlist[]
}

const PlaylistPage = ({auth, playlists}: PlaylistPageProps) => {
    const [isFileTypeOK, setIsFileTypeOK] = useState(false);
    const {data, setData, post} = useForm({
        file: {},
    });

    useEffect(() => {
        if (isFileTypeOK) {
            post('playlists');
        }
    }, [isFileTypeOK])

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
                <Card className="flex-1" placeholder={undefined}>
                    <form>
                        <div className="flex flex-col w-full h-48 items-center justify-center bg-grey-lighter">
                            <UploadButton title="Încarcă playlist" handleChange={handleChange}/>
                            <div>
                                Fișier HTML
                            </div>
                        </div>
                    </form>
                </Card>
                <Card className='flex w-1/2 ml-2 items-center' placeholder={undefined}>
                    <ListOfPlaylists playlists={playlists}/>
                </Card>
            </div>

        </AuthenticatedLayout>
    );
};

export default PlaylistPage;
