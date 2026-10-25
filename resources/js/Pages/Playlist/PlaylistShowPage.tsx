import React, {useEffect} from 'react';
import {Head, useForm} from '@inertiajs/react';
import {ArrowPathIcon, CheckCircleIcon} from '@heroicons/react/24/outline';
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
        <ArticlesList playlistTitle={playlist.title} renderLayout={(content, windowModeControls, modeSwitch) => <AuthenticatedLayout user={auth.user} headerAction={
            <div className="flex items-center gap-1.5 sm:gap-2">
                {windowModeControls}
                {modeSwitch}
                {recentlySuccessful && (
                    <span className="hidden items-center gap-1.5 text-xs font-medium text-[#248a3d] lg:inline-flex">
                        <CheckCircleIcon className="h-4 w-4"/>Playlist actualizat
                    </span>
                )}
                <button
                    type="button"
                    onClick={refreshParsing}
                    disabled={!playlist.can_refresh_parsing || processing}
                    aria-label={processing ? 'Se actualizează playlistul' : 'Refresh playlist'}
                    title={playlist.can_refresh_parsing ? `Actualizează playlistul din sursa ${playlist.source_type === 'enps' ? 'ENPS' : 'HTM'}` : 'Sursa salvată nu este disponibilă'}
                    className="ios-secondary-button !min-h-9 !rounded-full !px-2.5 sm:!px-3 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`}/>
                    <span className="hidden sm:inline">{processing ? 'Se actualizează…' : 'Refresh playlist'}</span>
                </button>
            </div>
        }>
            <Head title="Editor playlist"/>
            <div className="playlist-editor-page ios-page">
                {errors.playlist && (
                    <p role="alert" className="mb-4 rounded-2xl bg-[#ff3b30]/10 px-4 py-3 text-sm font-medium text-[#c9342f]">{errors.playlist}</p>
                )}
                {content}
            </div>
        </AuthenticatedLayout>}/>
    );
};

export default PlaylistShowPage;
