import ArticleItem from "@/Components/Articles/ArticleItem";
import {Fragment, useState} from "react";
import ImageEditorDialog from "@/Components/Dialogs/ImageEditorDialog";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectAllArticles, selectArticlesIds} from "@/Store/article/article.slice";
import AddNewArticleBtn from "@/Components/Articles/AddNewArticleBtn";
import NewArticleDialog from "@/Components/Dialogs/NewArticleDialog";
import ConfirmDialog from "@/Components/Dialogs/ConfirmDialog";
import {useActions} from "@/Hooks/useActions";
import {saveAs} from "file-saver";
import {Button} from "@material-tailwind/react";
import SaveButton from "@/Components/SaveButton";

const ArticlesList = () => {
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

    const {deleteArticle, unmarkForDelete} = useActions()
    const article_id_to_delete = useTypedSelector(state => state.articles.delete_id)

    const articlesIds = useTypedSelector(selectArticlesIds)
    const articles = useTypedSelector(selectAllArticles)

    const handleNewArticleDialogOpen = () => {
        setIsNewArticleDialogOpen(prevState => !prevState)
    }
    const handleImageDialogOpen = () => {
        setIsImageDialogOpen(prevState => !prevState);
    }

    const handleConfirmDialogOpen = () => {
        setIsConfirmDialogOpen(prevState => !prevState)
    }

    const handleConfirmAction = () => {
        if (article_id_to_delete) {
            deleteArticle({id: article_id_to_delete})
        }
        setIsConfirmDialogOpen(prevState => !prevState)
    }

    const handleCancelAction = () => {
        unmarkForDelete()
        setIsConfirmDialogOpen(prevState => !prevState)
    }

    return (
        <div className="shadow-sm sm:rounded-lg p-3">
            <div className='flex flex-wrap justify-start'>
                <AddNewArticleBtn handleDialog={handleNewArticleDialogOpen}/>
                {articlesIds && (articlesIds.map((articleID, index) =>
                    <Fragment key={articleID}>
                        <ArticleItem articleId={articleID}
                                     openDialog={() => setIsImageDialogOpen(true)}
                                     confirm={handleConfirmDialogOpen}
                        />
                        <AddNewArticleBtn articleID={articleID} handleDialog={handleNewArticleDialogOpen}/>
                    </Fragment>
                ))}
            </div>
            <div className='text-center my-2'>
                <SaveButton articles={articles}/>
            </div>
            <NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={handleNewArticleDialogOpen}/>
            <ImageEditorDialog isOpen={isImageDialogOpen} handleDialog={handleImageDialogOpen}/>
            <ConfirmDialog isOpen={isConfirmDialogOpen}
                           handleDialog={handleConfirmDialogOpen}
                           confirmAction={handleConfirmAction}
                           cancelAction={handleCancelAction}

            />
        </div>
    );
};
export default ArticlesList;
