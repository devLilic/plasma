import React, {useEffect} from 'react';
import PlaylistItem from "@/Components/Playlist/PlaylistItem";
import PlaylistFirstItem from "@/Components/Playlist/PlaylistFirstItem";
import {Playlist} from "@/types";
import {List, Typography} from "@material-tailwind/react";


interface ListOfPlaylistsProps {
    playlists: Playlist[]
}

const ListOfPlaylists = ({playlists}: ListOfPlaylistsProps) => {

    const noPlaylist = !playlists.length &&
        <Typography className="w-full flex justify-center items-center font-bold text-xl">No Playlist</Typography>;

    return (
        <>
            <div className='w-full flex items-stretch min-h-[180px]'>
                {playlists.length > 0 ? (
                    <div className="flex flex-col items-start mx-2 w-full">
                        <PlaylistFirstItem playlist={playlists[0]}/>
                        <List
                            placeholder={null}
                            className='mx-0 px-0 w-full'>
                            {playlists.slice(1).map(playlist => <PlaylistItem key={playlist.id} playlist={playlist}/>)}
                        </List>
                    </div>
                ) : noPlaylist}
            </div>
        </>
    );
};

export default ListOfPlaylists;
