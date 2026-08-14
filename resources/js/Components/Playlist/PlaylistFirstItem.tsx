import React, {useEffect, useState} from 'react';
import {Link} from '@inertiajs/react';
import {ArrowDownTrayIcon, ChevronRightIcon, SparklesIcon, TrashIcon} from '@heroicons/react/24/outline';
import {Playlist} from '@/types';
import SaveButton from '@/Components/SaveButton';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllArticles} from '@/Store/article/article.slice';

interface PlaylistFirstItemProps {
    playlist: Playlist
    onDelete: (playlist: Playlist) => void
}

const PlaylistFirstItem = ({playlist, onDelete}: PlaylistFirstItemProps) => {
    const [progress, setProgress] = useState(0);
    const articles = useTypedSelector(selectAllArticles);

    useEffect(() => {
        const done = articles.filter(article => article.image).length;
        setProgress(articles.length ? (done / articles.length) * 100 : 0);
    }, [articles]);

    return (
        <div className="bg-gradient-to-br from-[#007aff]/[0.09] to-[#5856d6]/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="ios-pill gap-1"><SparklesIcon className="h-3.5 w-3.5"/>Recent</span>
                <span className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#6e6e73]">{Math.round(progress)}% complet</span>
                    <button type="button" onClick={() => onDelete(playlist)} aria-label={`Șterge playlistul ${playlist.title}`} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-[#ff3b30] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#ff3b30]/15">
                        <TrashIcon className="h-4 w-4"/>
                    </button>
                </span>
            </div>
            <Link href={`/playlists/${playlist.id}`} className="group flex items-center gap-3">
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#1c1c1e]">{playlist.title}</span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-black/10">
                        <span className="block h-full rounded-full bg-[#34c759] transition-all" style={{width: `${progress}%`}}/>
                    </span>
                </span>
                <ChevronRightIcon className="h-5 w-5 text-[#8e8e93] transition group-hover:translate-x-0.5"/>
            </Link>
            <SaveButton articles={articles} className="mt-4 w-full !text-white">
                <ArrowDownTrayIcon className="h-4 w-4"/> Descarcă imaginile
            </SaveButton>
        </div>
    );
};

export default PlaylistFirstItem;
