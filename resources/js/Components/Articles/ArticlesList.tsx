import ArticleItem from "@/Components/Articles/ArticleItem";
import {Fragment, useState} from "react";
import ImageEditorDialog from "@/Components/Dialogs/ImageEditorDialog";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectArticlesIds} from "@/Store/article/article.slice";
import AddNewArticleBtn from "@/Components/Articles/AddNewArticleBtn";
import NewArticleDialog from "@/Components/Dialogs/NewArticleDialog";

const ArticlesList = () => {
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

    const articlesIds = useTypedSelector(selectArticlesIds)

    const handleNewArticleDialogOpen = () => {
        setIsNewArticleDialogOpen(prevState => !prevState)
    }
    const handleImageDialogOpen = () => {
        setIsImageDialogOpen(prevState => !prevState);
    }

    return (
        <div className="shadow-sm sm:rounded-lg p-3">
            <div className='flex flex-wrap justify-start'>
                <AddNewArticleBtn position={0} handleDialog={handleNewArticleDialogOpen}/>
                {articlesIds && (articlesIds.map((articleID, index) =>
                    <Fragment key={articleID}>
                        <ArticleItem articleId={articleID}
                                     openDialog={() => setIsImageDialogOpen(true)}
                                     handleNewArticleDialog={() => {
                                     }}
                        />
                        <AddNewArticleBtn position={index+1} handleDialog={handleNewArticleDialogOpen}/>
                    </Fragment>
                ))}
            </div>
            <div className='text-center my-2'>
                {/*<Button className="mb-3" onClick={saveImages}>Save</Button>*/}
            </div>
            <NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={handleNewArticleDialogOpen}/>
            <ImageEditorDialog isOpen={isImageDialogOpen} handleDialog={handleImageDialogOpen}/>
        </div>
    );
};
export default ArticlesList;
