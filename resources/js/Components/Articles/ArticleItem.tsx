import React from 'react';
import {Article} from "@/types";
import {Card, Checkbox, Input} from "@material-tailwind/react";
import ArticleHeader from "@/Components/Articles/ArticleHeader";
import ArticleFooter from "@/Components/Articles/ArticleFooter";

interface ArticleItemProps {
    article: Article
}

const ArticleItem = ({article}: ArticleItemProps) => {
    return (
        <Card>
            <ArticleHeader title={article.title} article_type={article.article_type}/>

            <div className="text-blue-600 text-xs px-2">
                <div className="inline-flex w-full mt-2 pr-4">
                    <Checkbox checked={true} color='purple'/>
                    <Input type="text" color="purple" label="Titlu" className=" w-full text-xs" value={article.title}/>
                </div>

                <Checkbox label={article.subtitle} color="purple"/>
            </div>

            <ArticleFooter article={article}/>
        </Card>
    );
};

export default ArticleItem;
