import React, {useState} from 'react';
import {router} from '@inertiajs/react';
import {QueueListIcon} from '@heroicons/react/24/outline';
import PlaylistItem from '@/Components/Playlist/PlaylistItem';
import PlaylistFirstItem from '@/Components/Playlist/PlaylistFirstItem';
import {Playlist} from '@/types';
import ConfirmDialog from '@/Components/Dialogs/ConfirmDialog';

interface ListOfPlaylistsProps {
    playlists?: Playlist[]
}

const ListOfPlaylists = ({playlists}: ListOfPlaylistsProps) => {
    const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
    const [deleting, setDeleting] = useState(false);

    if (!playlists?.length) {
        return (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2f2f7] text-[#8e8e93]">
                    <QueueListIcon className="h-6 w-6"/>
                </span>
                <p className="font-semibold text-[#1c1c1e]">Niciun playlist</p>
                <p className="mt-1 text-sm text-[#8e8e93]">Încarcă primul fișier pentru a începe.</p>
            </div>
        );
    }

    const deletePlaylist = () => {
        if (!playlistToDelete) return;
        setDeleting(true);
        router.delete(route('playlists.destroy', playlistToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setPlaylistToDelete(null),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <>
        <div className="divide-y divide-[#e5e5ea]">
            {playlists.map((playlist, index) => index === 0
                ? <PlaylistFirstItem key={playlist.id} playlist={playlist} onDelete={setPlaylistToDelete}/>
                : <PlaylistItem key={playlist.id} playlist={playlist} onDelete={setPlaylistToDelete}/>)
            }
        </div>
        <ConfirmDialog
            isOpen={playlistToDelete !== null}
            handleDialog={() => setPlaylistToDelete(null)}
            cancelAction={() => setPlaylistToDelete(null)}
            confirmAction={deletePlaylist}
            title="Ștergi playlistul?"
            description={`Articolele din „${playlistToDelete?.title ?? ''}” vor fi șterse definitiv. Imaginile și etichetele rămân în biblioteca media.`}
            confirmLabel="Șterge playlistul"
            processing={deleting}
        />
        </>
    );
};

export default ListOfPlaylists;
