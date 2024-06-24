import React from 'react';
import {Typography} from "@material-tailwind/react";
import {Playlist} from "@/types";
import {Link} from "@inertiajs/react";
import ListItem from "@/Components/Material/ListItem";

interface PlaylistItemProps {
    playlist: Playlist
}

const PlaylistItem = ({playlist}: PlaylistItemProps) => {
    return (
        <ListItem className='border border-green-700 rounded-lg flex p-0 overflow-hidden'>
            <Link href={`/playlists/${playlist.id}`} className="p-3 w-full">
                <Typography className='w-full'>{playlist.title} </Typography>
            </Link>
        </ListItem>
    );
};

export default PlaylistItem;
