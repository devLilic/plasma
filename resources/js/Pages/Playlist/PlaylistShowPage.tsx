import React, {useEffect} from 'react';
import {Head, Link} from '@inertiajs/react';
import {ChevronLeftIcon} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Article, User} from '@/types';
import ArticlesList from '@/Components/Articles/ArticlesList';
import {useActions} from '@/Hooks/useActions';

interface PlaylistShowPageProps {
    auth: {user: User}
    articles: Article[]
}

const PlaylistShowPage = ({auth, articles}: PlaylistShowPageProps) => {
    const {setArticles, fetchImages, setPlaylist} = useActions();
    const playlistId = articles[0]?.playlist_id;

    useEffect(() => {
        setArticles(articles);
        if (playlistId) setPlaylist(playlistId);
        fetchImages();
    }, []);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Editor playlist"/>
            <div className="ios-page">
                <nav className="mb-4" aria-label="Navigare playlist">
                    <Link href={route('playlists.index')} className="inline-flex items-center gap-1 text-sm font-semibold text-[#007aff] transition hover:text-[#006ee6]">
                        <ChevronLeftIcon className="h-4 w-4"/>Playlisturi
                    </Link>
                </nav>
                <ArticlesList/>
            </div>
        </AuthenticatedLayout>
    );
};

export default PlaylistShowPage;
