import {Article} from "@/types";
import ArticleItem from "@/Components/Articles/ArticleItem";
import NewArticleDialog from "@/Components/Dialogs/NewArticleDialog";
import {useEffect, useState} from "react";
import ImageEditorDialog from "@/Components/Dialogs/ImageEditorDialog";
import {useActions} from "@/Hooks/useActions";
import {useTypedSelector} from "@/Hooks/useTypedSelector";


const ArticlesList = () => {
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

    const {articles} = useTypedSelector(state => state.article)

    const {setCurrent} = useActions();

    // load images when the page loaded
    useEffect(() => {
        console.log('Loading images')
    }, []);

    const handleNewArticleDialogOpen = () => {
        setIsNewArticleDialogOpen(prevState => !prevState)
    }
    const handleImageDialogOpen = () => {
        console.log("open dialog")
        setIsImageDialogOpen(prevState => !prevState);
    }

    const editCurrentArticle = (id: number) => {
        setCurrent({id})
        setIsImageDialogOpen(true)
    }

    return (
        <div className="shadow-sm sm:rounded-lg p-3">
            <div className='grid grid-cols-4 gap-x-5 gap-y-5'>
                {articles && (
                    articles.map(article =>
                        <ArticleItem article={article}
                                     key={article.id}
                                     editArticle={() => editCurrentArticle(article.id)}
                                     handleNewArticleDialog={handleNewArticleDialogOpen}/>
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
