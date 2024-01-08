import React, {useState} from 'react';
import {Head} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Article, PageProps, User} from "@/types";
import {Card} from "@material-tailwind/react";
import ArticlesList from "@/Components/Articles/ArticlesList";

interface PlaylistShowPage extends PageProps{
    auth: {
        user: User
    }
    articles: Article[]
}

const PlaylistShowPage = ({auth, articles}: PlaylistShowPage) => {
    const [allArticles, setAllArticles] = useState<Article[]>(articles)

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Playlist"/>

            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1">
                    <ArticlesList/>
                    {/*<ArticlesList articles={allArticles}/>*/}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default PlaylistShowPage;
