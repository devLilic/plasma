import React, {useContext} from 'react';
import {Card, Input} from "@material-tailwind/react";
// import Checkbox from "@/Components/UI/FormElements/Checkbox";
// import Loading from "@/Components/UI/Svg/Loading";
import ArticleHeader from "@/Components/Articles/ArticleHeader";
// import ArticleFooter from "@/Components/Articles/ArticleFooter";
// import ContentWithImage from "@/Components/Articles/ContentWithImage";
import {Article} from "@/types";

interface ArticleItemProps {
    article: Article,
    // handleEditorDialog: () => void
    // handleNewArticleDialog: (article_id: string) => void,
    // loading: boolean
}

const ArticleItem = ({article}: ArticleItemProps) => {
// const ArticleItem = ({article, handleEditorDialog, handleNewArticleDialog, loading}: ArticleItemProps) => {

    // const articlesCtx = useContext<IArticlesContext>(ArticlesContext);
    //
    // const editSearchOption = (search_type) => {
    //     articlesCtx.editSearch(article.id, search_type)
    // }
    //
    // const editArticle = () => {
    //     articlesCtx.setArticleToEdit(article.id);
    //     // handleEditorDialog();
    // }
    //
    // const removeWallpaper = () => {
    //     articlesCtx.removeWallpaper(article.id)
    // }
    //
    // const showIntro = () => {
    //     articlesCtx.showIntro(article.id)
    // }
    //
    // const setCustomTitle = (event) => {
    //     articlesCtx.addCustomTitle(article.id, event.target.value)
    // }

    return (
        <Card>
            <ArticleHeader type={article.article_type} title={article.title}/>

            {/*{(loading && article.id === articlesCtx.articleToEdit) ?*/}
            {/*    (<div className='h-32 flex justify-center'>*/}
            {/*        <Loading/>*/}
            {/*    </div>) :*/}
            {/*    (article.image ?*/}
            {/*            (<ContentWithImage wallpaper={article.image.url} removeWallpaper={removeWallpaper}/>) :*/}
            {/*            <div className="text-blue-600">*/}
            {/*                <Label className='flex items-center py-1'>*/}
            {/*                    <Checkbox id={article.id + "_slug"}*/}
            {/*                              isChecked={article.search_by === 'slug'}*/}
            {/*                              onChange={editSearchOption.bind(null, 'slug')}*/}
            {/*                    />*/}
            {/*                    <span>{article.slug}</span>*/}
            {/*                </Label>*/}

            {/*                <Label className='flex items-center mr-2'>*/}
            {/*                    <Checkbox id={article.id + "_title"}*/}
            {/*                              isChecked={article.search_by === 'title'}*/}
            {/*                              onChange={editSearchOption.bind(null, 'title')}*/}
            {/*                    />*/}
            {/*                    <div>{article.title}</div>*/}
            {/*                </Label>*/}

            {/*                <Label className='flex justify-between items-center mt-2 mr-2 mb-5'>*/}
            {/*                    <Checkbox/>*/}
            {/*                    <Checkbox id={article.id + "_custom"}*/}
            {/*                              isChecked={article.search_by === 'custom'}*/}
            {/*                              onChange={editSearchOption.bind(null, 'custom')}*/}
            {/*                    />*/}
            {/*                    <Input label='Alte idei'*/}
            {/*                           value={article.custom}*/}
            {/*                           onChange={setCustomTitle}*/}
            {/*                    />*/}
            {/*                </Label>*/}
            {/*            </div>*/}
            {/*    )*/}
            {/*}*/}

            {/*<ArticleFooter showIntro={showIntro}*/}
            {/*               editArticle={editArticle}*/}
            {/*               isIntroDisplayed={article.isIntroDisplayed}*/}
            {/*               content={article.intro}*/}
            {/*               searchQuery={article.slug}*/}
            {/*               handleDialog={handleEditorDialog}*/}
            {/*/>*/}
        </Card>
    );
}

export default ArticleItem;
