import {useState} from 'react';
import {ArrowDownTrayIcon, PlusIcon, Squares2X2Icon} from '@heroicons/react/24/outline';
import ArticleItem from '@/Components/Articles/ArticleItem';
import ImageEditorDialog from '@/Components/Dialogs/ImageEditorDialog';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllArticles, selectArticlesIds} from '@/Store/article/article.slice';
import AddNewArticleBtn from '@/Components/Articles/AddNewArticleBtn';
import NewArticleDialog from '@/Components/Dialogs/NewArticleDialog';
import ConfirmDialog from '@/Components/Dialogs/ConfirmDialog';
import {useActions} from '@/Hooks/useActions';
import SaveButton from '@/Components/SaveButton';

const ArticlesList = () => {
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const {deleteArticle, unmarkForDelete} = useActions();
    const articleToDelete = useTypedSelector(state => state.articles.delete_id);
    const articleIds = useTypedSelector(selectArticlesIds);
    const articles = useTypedSelector(selectAllArticles);
    const completed = articles.filter(article => article.image).length;

    const confirmDelete = () => {
        if (articleToDelete) deleteArticle({id: articleToDelete});
        setIsConfirmDialogOpen(false);
    };

    const cancelDelete = () => {
        unmarkForDelete();
        setIsConfirmDialogOpen(false);
    };

    return (
        <div>
            <div className="mb-5 flex flex-col gap-4 rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5856d6]/10 text-[#5856d6]">
                        <Squares2X2Icon className="h-6 w-6"/>
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c1c1e]">{articles.length} materiale</h2>
                        <p className="mt-0.5 text-sm text-[#8e8e93]">{completed} cu imagine • {articles.length - completed} de completat</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AddNewArticleBtn handleDialog={() => setIsNewArticleDialogOpen(true)} label="Material nou"/>
                    <SaveButton articles={articles}><ArrowDownTrayIcon className="h-4 w-4"/>Descarcă toate</SaveButton>
                </div>
            </div>

            <div className="grid items-start gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {articleIds.map(articleId => (
                    <div className="relative" key={articleId}>
                        <ArticleItem articleId={articleId} openDialog={() => setIsImageDialogOpen(true)} confirm={() => setIsConfirmDialogOpen(true)}/>
                        <AddNewArticleBtn articleID={articleId} handleDialog={() => setIsNewArticleDialogOpen(true)} compact/>
                    </div>
                ))}
            </div>

            <NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={() => setIsNewArticleDialogOpen(open => !open)}/>
            <ImageEditorDialog isOpen={isImageDialogOpen} handleDialog={() => setIsImageDialogOpen(open => !open)}/>
            <ConfirmDialog isOpen={isConfirmDialogOpen} handleDialog={() => setIsConfirmDialogOpen(open => !open)} confirmAction={confirmDelete} cancelAction={cancelDelete}/>
        </div>
    );
};

export default ArticlesList;
