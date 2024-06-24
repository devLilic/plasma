import React, {ChangeEvent} from 'react';
import {Card, Checkbox, Input} from "@material-tailwind/react";
import ArticleHeader from "@/Components/Articles/ArticleHeader";
import ArticleFooter from "@/Components/Articles/ArticleFooter";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import ContentWithImage from "@/Components/Articles/ContentWithImage";
import {useActions} from "@/Hooks/useActions";
import {selectArticleById} from "@/Store/article/article.slice";

interface ArticleItemProps {
    articleId: number,
    openDialog: () => void
    confirm: () => void
}

const ArticleItem = ({articleId, openDialog, confirm}: ArticleItemProps) => {
    const article = useTypedSelector(state => selectArticleById(state, articleId))

    const {
        changeSearchBy,
        changeTitle,
        changeSubtitle
    } = useActions()

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        changeTitle({id: article.id, changes: {title: e.target.value}})
    }
    const handleSubtitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        changeSubtitle({id: article.id, changes: {subtitle: e.target.value}})
    }

    return (
        <Card placeholder={undefined} className='w-[270px] m-2'>
            <ArticleHeader
                id={article.id}
                title={article.block_title}
                article_type={article.article_type}
                confirm={confirm}
            />
            {article.image?.url ?
                <ContentWithImage articleId={articleId} image={article.image}/>
                : (
                    <div className="text-blue-600 text-xs px-2 min-h-[150px]">
                        <div className="inline-flex w-full mt-6 pr-4">
                            <Checkbox
                                label={article.search_by !== "title" ? article.title : ''}
                                checked={article.search_by === "title"}
                                color='purple'
                                crossOrigin={undefined}
                                onChange={() => {
                                    changeSearchBy({id: article.id, changes: {search_by: "title"}})
                                }}/>
                            {article.search_by === "title" && <Input type="text"
                                                                     color="purple"
                                                                     label="Titlu"
                                                                     className="w-full text-xs"
                                                                     value={article.title}
                                                                     crossOrigin={undefined}
                                                                     onChange={handleTitleChange}/>
                            }

                        </div>

                        <div className="inline-flex w-full mt-6 pr-4">
                            <Checkbox label={article.search_by !== "subtitle" ? article.subtitle : ''}
                                      checked={article.search_by === "subtitle"}
                                      color="purple"
                                      onChange={() => {
                                          changeSearchBy({id: article.id, changes: {search_by: "subtitle"}})
                                      }}
                                      crossOrigin={undefined}/>
                            {article.search_by === "subtitle" && <Input type="text"
                                                                        color="purple"
                                                                        label="Subtitlu"
                                                                        className="w-full text-xs"
                                                                        value={article.subtitle}
                                                                        crossOrigin={undefined}
                                                                        onChange={handleSubtitleChange}/>
                            }
                        </div>
                    </div>
                )}

            <ArticleFooter articleId={article.id} openDialog={openDialog}/>
        </Card>
    );
};

export default ArticleItem;
