import React, {useEffect, useState} from 'react';
import {Playlist} from "@/types";
import SaveButton from "@/Components/SaveButton";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectAllArticles} from "@/Store/article/article.slice";
import {Progress} from "@material-tailwind/react";

interface PlaylistFirstItemProps {
    playlist: Playlist
}

const PlaylistFirstItem = ({playlist}: PlaylistFirstItemProps) => {
    const [progress, setProgress] = useState(0)

    const articles = useTypedSelector(selectAllArticles)
    const calculatePercent = () => {
        const allArticles = articles.length
        const done = articles.filter(article => article.image).length
        setProgress(done / allArticles * 100);
    }
    useEffect(() => {
        calculatePercent()
    }, []);

    return (
        <div
            className='px-3 py-3 bg-blue-50 text-blue-600 border border-green-700 rounded-lg mt-2 flex flex-col w-full'>


            <div className='flex items-center w-full justify-between'>

                <a className='px-2 py-0 rounded hover:underline'
                   href={`/playlists/` + playlist.id}>{playlist.title}</a>
                <Progress value={progress}
                          placeholder={null}
                          color={'green'}
                          variant={'gradient'}
                          className={' h-4 border border-green-800 mx-8'}/>
                <SaveButton articles={articles}
                            className={"px-4 mx-2 !overflow-visible border-red-500 bg-transparent border text-red-500 hover:bg-red-500 hover:text-white py-2"}/>

            </div>
        </div>
    );
};

export default PlaylistFirstItem;
