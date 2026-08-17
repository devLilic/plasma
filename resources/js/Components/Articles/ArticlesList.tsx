import {useEffect, useState} from 'react';
import {ArrowDownTrayIcon, PlusIcon} from '@heroicons/react/24/outline';
import ImageEditorDialog from '@/Components/Dialogs/ImageEditorDialog';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllArticles} from '@/Store/article/article.slice';
import NewArticleDialog from '@/Components/Dialogs/NewArticleDialog';
import ConfirmDialog from '@/Components/Dialogs/ConfirmDialog';
import {useActions} from '@/Hooks/useActions';
import SaveButton from '@/Components/SaveButton';
import PlaylistArticleSidebar from '@/Components/Articles/PlaylistArticleSidebar';
import ArticleWorkspace from '@/Components/Articles/ArticleWorkspace';

const ArticlesList = () => {
    const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
    const {deleteArticle, unmarkForDelete, markForDelete, setCurrent, changeNewArticlePosition} = useActions();
    const articleToDelete = useTypedSelector(state => state.articles.delete_id);
    const currentId = useTypedSelector(state => state.articles.current);
    const articles = useTypedSelector(selectAllArticles);
    const currentArticle = articles.find(article => article.id === currentId);
    const completed = articles.filter(article => article.image).length;

    useEffect(() => {
        if (articles.length && !currentArticle) setCurrent({id: articles[0].id});
    }, [articles, currentArticle, setCurrent]);

    const selectArticle = (id: number) => {
        setCurrent({id});
        setActiveTab('text');
    };
    const openNewArticle = (position: number) => {
        changeNewArticlePosition(position);
        setIsNewArticleDialogOpen(true);
    };
    const requestDelete = () => {
        if (!currentArticle) return;
        markForDelete(currentArticle.id);
        setIsConfirmDialogOpen(true);
    };
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
            <div className="ios-card mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                    <h2 className="text-lg font-bold tracking-[-0.02em] text-[#172033]">Editor playlist</h2>
                    <p className="mt-0.5 text-sm text-[#65728a]">{articles.length} materiale • {completed} cu imagine • {articles.length - completed} de completat</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => openNewArticle(articles.length + 1)} className="ios-secondary-button">
                        <PlusIcon className="h-4 w-4"/>Material nou
                    </button>
                    <SaveButton articles={articles}><ArrowDownTrayIcon className="h-4 w-4"/>Descarcă toate</SaveButton>
                </div>
            </div>

            {articles.length ? (
                <div className="playlist-workspace-grid">
                    <PlaylistArticleSidebar articles={articles} currentId={currentArticle?.id ?? 0} onSelect={selectArticle} onAddAfter={article => openNewArticle(article.playlist_order + 1)}/>
                    {currentArticle && (
                        <ArticleWorkspace article={currentArticle} activeTab={activeTab} onTabChange={setActiveTab}
                                          onOpenImageModal={() => setIsImageDialogOpen(true)} onDelete={requestDelete}/>
                    )}
                </div>
            ) : (
                <div className="ios-card flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                    <p className="text-lg font-bold text-[#172033]">Playlistul nu conține materiale</p>
                    <p className="mt-1 text-sm text-[#65728a]">Adaugă primul material pentru a începe editarea.</p>
                    <button type="button" onClick={() => openNewArticle(1)} className="ios-primary-button mt-5"><PlusIcon className="h-4 w-4"/>Material nou</button>
                </div>
            )}

            <NewArticleDialog isOpen={isNewArticleDialogOpen} handleDialog={() => setIsNewArticleDialogOpen(open => !open)}/>
            <ImageEditorDialog isOpen={isImageDialogOpen} handleDialog={() => setIsImageDialogOpen(open => !open)}/>
            <ConfirmDialog isOpen={isConfirmDialogOpen} handleDialog={() => setIsConfirmDialogOpen(open => !open)} confirmAction={confirmDelete} cancelAction={cancelDelete}/>
        </div>
    );
};

export default ArticlesList;
