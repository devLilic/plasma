import React from 'react';
import {Link} from '@inertiajs/react';
import {ChevronRightIcon, DocumentTextIcon, TrashIcon} from '@heroicons/react/24/outline';
import {Playlist} from '@/types';

interface PlaylistItemProps {
    playlist: Playlist
    onDelete: (playlist: Playlist) => void
}

const PlaylistItem = ({playlist, onDelete}: PlaylistItemProps) => (
    <div className="flex items-center gap-1 pr-3 transition hover:bg-[#f2f2f7]/70">
        <Link href={`/playlists/${playlist.id}`} className="group flex min-w-0 flex-1 items-center gap-3 px-5 py-4 pr-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f2f7] text-[#5856d6]">
                <DocumentTextIcon className="h-5 w-5"/>
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#1c1c1e]">{playlist.title}</span>
                <span className="mt-0.5 block text-xs text-[#8e8e93]">Playlist editorial</span>
            </span>
            <ChevronRightIcon className="h-5 w-5 text-[#c7c7cc] transition group-hover:translate-x-0.5 group-hover:text-[#007aff]"/>
        </Link>
        <button type="button" onClick={() => onDelete(playlist)} aria-label={`Șterge playlistul ${playlist.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#ff3b30] transition hover:bg-[#ff3b30]/10 focus:outline-none focus:ring-4 focus:ring-[#ff3b30]/15">
            <TrashIcon className="h-[18px] w-[18px]"/>
        </button>
    </div>
);

export default PlaylistItem;
