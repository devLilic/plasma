import React, {useEffect} from 'react';
import {Head} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Article, User} from "@/types";
import {Card} from "@material-tailwind/react";
import ArticlesList from "@/Components/Articles/ArticlesList";
import {useActions} from "@/Hooks/useActions";

interface PlaylistShowPageProps {
    auth: {
        user: User
    }
    articles: Article[]
}

const PlaylistShowPage = ({auth, articles}: PlaylistShowPageProps) => {
    const {setArticles, fetchImages, setPlaylist} = useActions()
    useEffect(() => {
        setArticles(articles)
        if(articles.length !== 0){
            setPlaylist(articles[0].playlist_id)
        }
        fetchImages()
    }, []);
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Playlist"/>

            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1" placeholder={undefined}>
                    <ArticlesList />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default PlaylistShowPage;
