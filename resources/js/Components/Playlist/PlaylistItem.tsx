import React from 'react';
import {ListItem, Progress, Typography} from "@material-tailwind/react";
import {Playlist} from "@/types";
import {Link} from "@inertiajs/react";

interface PlaylistItemProps {
    playlist: Playlist
}

const PlaylistItem = ({playlist}: PlaylistItemProps) => {
    return (
        <a href={`/playlists/${playlist.id}`}>
            <ListItem
                className='text-sm bg-transparent border border-green-700 rounded-lg flex justify-between items-center'>
                <Typography className='w-full'>{playlist.title} </Typography>
            </ListItem>
        </a>
    );
};

export default PlaylistItem;
