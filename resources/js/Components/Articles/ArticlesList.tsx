import {Article} from "@/types";
import ArticleItem from "@/Components/Articles/ArticleItem";
import NewArticleDialog from "@/Components/Dialogs/NewArticleDialog";
import {useState} from "react";
import ImageEditorDialog from "@/Components/Dialogs/ImageEditorDialog";

interface ArticlesListProps {
    articles: Article[]
}

const ArticlesList = ({articles}: ArticlesListProps) => {
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [currentArticle, setCurrentArticle] = useState(articles[0])

    const handleNewArticleDialogOpen = () => {
        setIsNewArticleDialogOpen(prevState => !prevState)
    }
    const handleImageDialogOpen = () => {
        setIsImageDialogOpen(prevState => !prevState)
    }

    const handleSetCurrentArticle = (id: number) => {
        let selectedArticle = articles.find(article => article.id === id)
        setCurrentArticle(prevState => selectedArticle ?? prevState)
        setIsImageDialogOpen(true)
    }

    return (
        <div className="shadow-sm sm:rounded-lg p-3">
            <div className='grid grid-cols-3 gap-x-5 gap-y-5'>
                {articles && (
                    articles.map(article =>
                        <ArticleItem article={article}
                                     key={article.id}
                                     setCurrent={() => handleSetCurrentArticle(article.id)}
                                     handleNewArticleDialog={handleNewArticleDialogOpen}
                        />
                    )
                )}
            </div>
            <div className='text-center my-2'>
                {/*<Button className="mb-3" onClick={saveImages}>Save</Button>*/}
            </div>
            <NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={handleNewArticleDialogOpen}/>
            <ImageEditorDialog isOpen={isImageDialogOpen} handleDialog={handleImageDialogOpen}
                               article={currentArticle}/>
        </div>
    );
};
export default ArticlesList;
