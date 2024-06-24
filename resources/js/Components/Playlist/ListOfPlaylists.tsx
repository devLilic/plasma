import React, {useEffect} from 'react';
import PlaylistItem from "@/Components/Playlist/PlaylistItem";
import PlaylistFirstItem from "@/Components/Playlist/PlaylistFirstItem";
import {Playlist} from "@/types";
import List from "@/Components/Material/List";
import {Typography} from "@material-tailwind/react";


interface ListOfPlaylistsProps {
    playlists?: Playlist[]
}

const ListOfPlaylists = ({playlists}: ListOfPlaylistsProps) => {

    const noPlaylist = <Typography className="w-full flex justify-center items-center font-bold text-xl">No
        Playlist</Typography>;

    return (
        <>
            <div className='w-full flex items-stretch min-h-[180px]'>
                {playlists?.length ? (
                    <div className="flex flex-col items-start mx-2 w-full">
                        <List className='mx-0 px-0 w-full'>
                            {playlists.map((playlist, key) => {
                                    return !key ? <PlaylistFirstItem key={playlist.id} playlist={playlist}/> :
                                        <PlaylistItem key={playlist.id} playlist={playlist}/>
                                }
                            )}
                        </List>
                    </div>
                ) : noPlaylist}
            </div>
        </>
    );
};

export default ListOfPlaylists;
