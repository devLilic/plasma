import React, {useState} from 'react';
import {Head} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Article, User} from "@/types";
import {Card} from "@material-tailwind/react";
import ArticleItem from "@/Components/Articles/ArticleItem";
import ArticlesList from "@/Components/Articles/ArticlesList";

interface PlaylistShowPageProps {
    auth: {
        user: User
    }
    articles: Article[]
}

const PlaylistShowPage = ({auth, articles}: PlaylistShowPageProps) => {


    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Playlist"/>

            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1">
                    <ArticlesList  articles={articles}/>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default PlaylistShowPage;
