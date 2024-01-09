import React, {ChangeEvent, useState} from 'react';
import {Article} from "@/types";
import {Card, Checkbox, Input} from "@material-tailwind/react";
import ArticleHeader from "@/Components/Articles/ArticleHeader";
import ArticleFooter from "@/Components/Articles/ArticleFooter";

interface ArticleItemProps {
    article: Article,
    handleNewArticleDialog: () => void
    setCurrent: (id:number) => void
}

const ArticleItem = ({article, handleNewArticleDialog, setCurrent}: ArticleItemProps) => {
    const [articleTitle, setArticleTitle] = useState(article.title)

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setArticleTitle(prevState => e.target.value)
    }

    return (
        <Card>
            <ArticleHeader title={article.title} article_type={article.article_type} openDialog={handleNewArticleDialog}/>

            <div className="text-blue-600 text-xs px-2">
                <div className="inline-flex w-full mt-2 pr-4">
                    <Checkbox checked={true} color='purple' onChange={() => {}}/>
                    <Input type="text" color="purple" label="Titlu" className=" w-full text-xs" value={articleTitle} onChange={handleTitleChange}/>
                </div>

                <Checkbox label={article.subtitle} color="purple" onChange={() => {}}/>
            </div>

            <ArticleFooter article={article} setCurrent={()=>setCurrent(article.id)}/>
        </Card>
    );
};

export default ArticleItem;
