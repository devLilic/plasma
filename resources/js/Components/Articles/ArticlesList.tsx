// import {Button} from "@material-tailwind/react";
// import saveAs from 'file-saver';
// import ArticleItem from "@/Components/Articles/ArticleItem";
// import {Article} from "@/types";

import {Article} from "@/types";
import ArticleItem from "@/Components/Articles/ArticleItem";

interface ArticlesListProps {
    articles: Article[]
}

const ArticlesList = ({articles}: ArticlesListProps) => {

    return (
        <div className="shadow-sm sm:rounded-lg p-3">
            <div className='grid grid-cols-3 gap-x-5 gap-y-5'>
                {articles && (
                    articles.map(article =>
                        <ArticleItem article={article} key={article.id}/>
                    )
                )}
            </div>
            <div className='text-center my-2'>
                {/*<Button className="mb-3" onClick={saveImages}>Save</Button>*/}
            </div>
            {/*<ImageEditorDialog dialogOpen={editorDialogOpen} handleDialog={handleEditorDialog}/>*/}
            {/*<NewArticleDialog dialogOpen={newArticleDialogOpen} handleDialog={handleNewArticleDialog} saveArticle={addNewArticle}/>*/}
        </div>
    );
};
export default ArticlesList;
