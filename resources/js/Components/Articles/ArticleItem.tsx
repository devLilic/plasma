import React, {ChangeEvent, useState} from 'react';
import {Article} from "@/types";
import {Card, Checkbox, Input} from "@material-tailwind/react";
import ArticleHeader from "@/Components/Articles/ArticleHeader";
import ArticleFooter from "@/Components/Articles/ArticleFooter";
import {useSelector} from "react-redux";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import ContentWithImage from "@/Components/Articles/ContentWithImage";
import {useActions} from "@/Hooks/useActions";
import {selectArticleById} from "@/Store/article/article.slice";

interface ArticleItemProps {
    articleId: number,
    handleNewArticleDialog: () => void
    openDialog: () => void
}

const ArticleItem = ({articleId, handleNewArticleDialog, openDialog}: ArticleItemProps) => {
    const article = useTypedSelector(state => selectArticleById(state, articleId))
    const [articleTitle, setArticleTitle] = useState(article.title)

    // const {removeBackground} = useActions()

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setArticleTitle(prevState => e.target.value)
    }

    return (
        <Card placeholder={undefined}>
            <ArticleHeader title={article.title}
                           article_type={article.article_type}
                           openDialog={handleNewArticleDialog}/>
            {article.imageId ?
                <ContentWithImage articleId={articleId} imageId={article.imageId}/>
                : (
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

            <ArticleFooter articleId={article.id} openDialog={openDialog}/>
        </Card>
    );
};

export default ArticleItem;
