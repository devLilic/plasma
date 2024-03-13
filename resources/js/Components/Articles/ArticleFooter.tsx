import React from 'react';
import { Popover, PopoverContent, PopoverHandler} from "@material-tailwind/react";
import SearchImageIcon from "@/Components/UI/Svg/SearchImageIcon";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectArticleById} from "@/Store/article/article.slice";
import {useActions} from "@/Hooks/useActions";
import Button from "@/Components/Material/Button";
import SearchExternalImages from "@/Components/ExternalImages/SearchExternalImages";

interface ArticleFooterProps {
    articleId: number,
    openDialog: () => void
}

const ArticleFooter = ({articleId, openDialog}: ArticleFooterProps) => {
    const article = useTypedSelector(state => selectArticleById(state, articleId))
    const {setCurrent} = useActions()
    const query = article.search_by === "title" ? article.title : article.subtitle

    const onSearchQuery = () => {
        setCurrent({id: article.id})
        openDialog()
    }

    const editArticle = () => {
        setCurrent({id: articleId})
        openDialog()
    }

    return (
        <div
            className='mb-3 px-2 flex flex-col items-center justify-center border-t border-blue-500 border-dashed pt-3'>

            <div className='flex justify-between w-full'>
                {article.intro && <Popover>
                    <PopoverHandler className='p-1 my-1'>
                        <Button variant="outlined"
                                color='purple'
                                className='my-2'
                        >Intro</Button>
                    </PopoverHandler>
                    <PopoverContent className="z-20 bg-yellow-100 max-w-[300px]"
                                    placeholder={undefined}
                    >{article.intro}</PopoverContent>
                </Popover>}

                <SearchExternalImages query={query} withModal={onSearchQuery}/>

                <Button variant='outlined'
                        color='purple'
                        size='sm'
                        className='my-1 py-0'
                        type='button'
                        onClick={editArticle}
                ><SearchImageIcon/></Button>
            </div>
        </div>
    );
};

export default ArticleFooter;
