import React, {useCallback, useEffect, useState} from 'react';
import {Playlist} from "@/types";
import SaveButton from "@/Components/SaveButton";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectAllArticles} from "@/Store/article/article.slice";
import Progress from "@/Components/Material/Progress";
import ListItem from "@/Components/Material/ListItem";
import {Link} from "@inertiajs/react";
import {Typography} from "@material-tailwind/react";

interface PlaylistFirstItemProps {
    playlist: Playlist
}

const PlaylistFirstItem = ({playlist}: PlaylistFirstItemProps) => {
    const [progress, setProgress] = useState(0)

    const articles = useTypedSelector(selectAllArticles)

    useEffect(() => {
        const calculatePercent = () => {
            const allArticles = articles.length
            const done = articles.filter(article => article.image).length
            setProgress(done / allArticles * 100);
        }
        calculatePercent()
    }, [articles.length]);

    return (
        <ListItem
            className='bg-blue-50 border border-green-700 rounded-lg flex items-start p-0'>

            <Link className='flex-grow p-4 flex-col text-center'
                  href={`/playlists/${playlist.id}`}>
                <Typography className='mb-4 text-lg font-bold'>{playlist.title}</Typography>
                <Progress value={progress}
                          color={'green'}
                          variant={'gradient'}
                          className={' h-4 border border-green-800'}/>
            </Link>

            <SaveButton articles={articles}
                        className={"self-stretch my-4 mr-2 ml-2 border-green-500 bg-green-100 border text-sm text-green-500 hover:bg-green-500 hover:text-white"}/>

        </ListItem>
    );
};

export default PlaylistFirstItem;
