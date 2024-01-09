import React from 'react';
import {Button, Progress} from "@material-tailwind/react";
import {Playlist} from "@/types";

interface PlaylistFirstItemProps {
    playlist: Playlist
}

const PlaylistFirstItem = ({playlist}: PlaylistFirstItemProps) => {
    return (
        <div className='px-3 py-3 bg-blue-50 text-blue-600 border border-green-700 rounded-lg mt-2 flex flex-col w-full'>

            {/*<div className="mx-4 py-4 w-8/12 flex">*/}
            {/*    <Progress value={80}*/}
            {/*              color={'green'}*/}
            {/*              variant={'gradient'}*/}
            {/*              className={'rounded h-4 border border-green-800'}/>*/}
            {/*</div>*/}

            <div className='flex items-center w-full justify-between'>
                <a className='px-2 py-0 rounded hover:underline'
                   href={`/playlists/` + playlist.id}>{playlist.title}</a>
                <Button className={"px-2 mx-2 border-red-500 bg-transparent border text-red-500 hover:bg-red-500 hover:text-white"}
                        color='red'
                        size='sm'
                        ripple={false}
                >Download</Button>
            </div>
        </div>
    );
};

export default PlaylistFirstItem;
