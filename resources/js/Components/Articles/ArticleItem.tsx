import React, {ChangeEvent, useState} from 'react';
import {Article} from "@/types";
import {Card, Checkbox, Input} from "@material-tailwind/react";
import ArticleHeader from "@/Components/Articles/ArticleHeader";
import ArticleFooter from "@/Components/Articles/ArticleFooter";
import {useSelector} from "react-redux";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import ContentWithImage from "@/Components/Articles/ContentWithImage";
import {useActions} from "@/Hooks/useActions";

interface ArticleItemProps {
    article: Article,
    handleNewArticleDialog: () => void
    editArticle: (id: number) => void
}

const ArticleItem = ({article, handleNewArticleDialog, editArticle}: ArticleItemProps) => {
    const [articleTitle, setArticleTitle] = useState(article.title)

    const {removeBackground} = useActions()

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setArticleTitle(prevState => e.target.value)
    }

    return (
        <Card placeholder={undefined}>
            <ArticleHeader title={article.title}
                           article_type={article.article_type}
                           openDialog={handleNewArticleDialog}/>

            {article.image ? <ContentWithImage wallpaper={article.image.url} removeBackground={()=>removeBackground({articleId: article.id})}/> : (
                <div className="text-blue-600 text-xs px-2 min-h-[160px]">
                    <div className="inline-flex w-full mt-6 mb-4 pr-4">
                        <Checkbox
                            checked={true}
                            color='purple'
                            crossOrigin={undefined}
                            onChange={() => {
                            }}/>
                        <Input type="text"
                               color="purple"
                               label="Titlu"
                               className="w-full text-xs"
                               value={articleTitle}
                               crossOrigin={undefined}
                               onChange={handleTitleChange}/>
                    </div>

                    <Checkbox label={article.subtitle}
                              color="purple"
                              onChange={() => {
                              }}
                              crossOrigin={undefined}/>
                </div>
            )}

            <ArticleFooter article={article} editArticle={() => editArticle(article.id)}/>
        </Card>
    );
};

export default ArticleItem;
