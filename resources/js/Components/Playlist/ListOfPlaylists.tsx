import React, {useEffect, useState} from 'react';
import PlaylistItem from "@/Components/Playlist/PlaylistItem";
import PlaylistFirstItem from "@/Components/Playlist/PlaylistFirstItem";
import {Playlist} from "@/types";
import {List, Typography} from "@material-tailwind/react";

const ListOfPlaylists = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([
        {id: 1, title: "Jurnal 2024-01-03 13.00", playDate: "2024-01-03 13.00"},
        {id: 2, title: "Jurnal 2024-01-03 18.00", playDate: "2024-01-03 18.00"},
        {id: 3, title: "Jurnal 2024-01-03 22.00", playDate: "2024-01-03 22.00"},
        {id: 4, title: "Jurnal 2024-01-04 13.00", playDate: "2024-01-04 13.00"},
        {id: 5, title: "Jurnal 2024-01-04 18.00", playDate: "2024-01-04 18.00"}
    ])

    // useEffect(() => {
    //     fetch("/api/v1/playlists", {
    //         method: "GET",
    //         headers: {
    //             "Content-Type": "application/json"
    //         }
    //     }).then(result => result.json())
    //         .then(data => setPlaylists(data.data))
    // }, []);

    const noPlaylist = !playlists.length &&
        <Typography className="w-full flex justify-center items-center font-bold text-xl">No Playlist</Typography>;

    return (
        <div className='w-full flex items-stretch min-h-[180px]'>
            {playlists.length > 0 ? (
                    <div className="flex justify-around items-start mx-2 w-full">
                        <PlaylistFirstItem playlist={playlists[0]}/>
                        <List className='w-6/12 ml-2'>
                            {playlists.slice(1).map(playlist => <PlaylistItem key={playlist.id} playlist={playlist}/>)}
                        </List>
                    </div>
                ) : noPlaylist}
        </div>
    );
};

export default ListOfPlaylists;
