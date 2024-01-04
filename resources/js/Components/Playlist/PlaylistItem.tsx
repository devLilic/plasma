import React from 'react';
import {ListItem, Progress, Typography} from "@material-tailwind/react";
import {Playlist} from "@/types";
import {Link} from "@inertiajs/react";

interface PlaylistItemProps {
    playlist: Playlist
}

const PlaylistItem = ({playlist}: PlaylistItemProps) => {
    return (
        <ListItem
            className='text-sm px-3 py-2 bg-transparent border border-green-700 rounded-lg flex justify-between items-center mb-2'>
            <Typography className='w-full'>{playlist.title} </Typography>

            {/*<div className="mx-4 p-1 w-6/12 flex">*/}
            {/*    <Progress value={80}*/}
            {/*              color={'green'}*/}
            {/*              variant={'gradient'}*/}
            {/*              className={'rounded h-4 border border-green-800'}/>*/}
            {/*</div>*/}

            <div className='flex items-center'>
                <Link href={`/playlists/${playlist.id}`}
                      as="button"
                      className='border border-blue-600 px-2 py-2 rounded hover:bg-blue-400 hover:text-white'>Deschide</Link>
            </div>
        </ListItem>
    );
};

export default PlaylistItem;
