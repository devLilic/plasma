import React, {useEffect} from 'react';
import {Head, Link, useForm} from '@inertiajs/react';
import {ArrowPathIcon, CheckCircleIcon, ChevronLeftIcon} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Article, Playlist, User} from '@/types';
import ArticlesList from '@/Components/Articles/ArticlesList';
import {useActions} from '@/Hooks/useActions';

interface PlaylistShowPageProps {
    auth: {user: User}
    playlist: Playlist
    articles: Article[]
}

const PlaylistShowPage = ({auth, playlist, articles}: PlaylistShowPageProps) => {
    const {setArticles, fetchImages, setPlaylist} = useActions();
    const {post, processing, recentlySuccessful, errors} = useForm<{playlist: string}>({playlist: ''});

    useEffect(() => {
        setArticles(articles);
        setPlaylist(playlist.id);
        fetchImages();
    }, [articles, playlist.id]);

    const refreshParsing = () => {
        post(route('playlists.refresh-parsing', playlist.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Editor playlist"/>
            <div className="ios-page">
                <nav className="mb-4 flex flex-wrap items-center justify-between gap-3" aria-label="Navigare playlist">
                    <Link href={route('playlists.index')} className="ios-secondary-button !min-h-9 !rounded-full !px-3">
                        <ChevronLeftIcon className="h-4 w-4"/>Playlisturi
                    </Link>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {recentlySuccessful && (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#248a3d]">
                                <CheckCircleIcon className="h-5 w-5"/>Parsing actualizat
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={refreshParsing}
                            disabled={!playlist.can_refresh_parsing || processing}
                            title={playlist.can_refresh_parsing ? 'Reprocesează fișierul HTM salvat' : 'Fișierul HTM sursă nu este disponibil'}
                            className="ios-secondary-button !min-h-9 !rounded-full !px-3 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`}/>
                            {processing ? 'Se reprocesează…' : 'Refresh parsing'}
                        </button>
                    </div>
                </nav>
                {errors.playlist && (
                    <p className="mb-4 rounded-2xl bg-[#ff3b30]/10 px-4 py-3 text-sm font-medium text-[#c9342f]">{errors.playlist}</p>
                )}
                <ArticlesList/>
            </div>
        </AuthenticatedLayout>
    );
};

export default PlaylistShowPage;
