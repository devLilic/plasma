import {Article} from "@/types";
import ArticleItem from "@/Components/Articles/ArticleItem";
import NewArticleDialog from "@/Components/Dialogs/NewArticleDialog";
import {useEffect, useState} from "react";
import ImageEditorDialog from "@/Components/Dialogs/ImageEditorDialog";
import {useActions} from "@/Hooks/useActions";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectAllArticles, selectArticlesIds} from "@/Store/article/article.slice";

const ArticlesList = () => {
    // const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

    const articlesIds = useTypedSelector(selectArticlesIds)

    // const handleNewArticleDialogOpen = () => {
    //     setIsNewArticleDialogOpen(prevState => !prevState)
    // }
    const handleImageDialogOpen = () => {
        setIsImageDialogOpen(prevState => !prevState);
    }

    return (
        <div className="shadow-sm sm:rounded-lg p-3">
            <div className='grid grid-cols-4 gap-x-5 gap-y-5'>
                {articlesIds && (articlesIds.map(articleID =>
                    <ArticleItem articleId={articleID}
                                 key={articleID}
                                 openDialog={() => setIsImageDialogOpen(true)}
                                 handleNewArticleDialog={() => {}}
                    />
                ))}
            </div>
            <div className='text-center my-2'>
                {/*<Button className="mb-3" onClick={saveImages}>Save</Button>*/}
            </div>
            {/*<NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={handleNewArticleDialogOpen}/>*/}
            <ImageEditorDialog isOpen={isImageDialogOpen} handleDialog={handleImageDialogOpen}/>
        </div>
    );
};
export default ArticlesList;
