import React, {useState} from 'react';
import {Button, Popover, PopoverContent, PopoverHandler} from "@material-tailwind/react";
import GoogleIcon from "@/Components/UI/Svg/GoogleIcon";
import SearchImageIcon from "@/Components/UI/Svg/SearchImageIcon";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectArticleById} from "@/Store/article/article.slice";
import {useActions} from "@/Hooks/useActions";

interface ArticleFooterProps {
    articleId: number,
    openDialog: () => void
}

const ArticleFooter = ({articleId, openDialog}: ArticleFooterProps) => {
    const article = useTypedSelector(state => selectArticleById(state, articleId))
    const {setCurrent} = useActions()
    const query = article.search_by === "title" ? article.title : article.subtitle

    const visitGoogle = () => {
        setCurrent({id: articleId})
        window.open(
            `https://www.google.com/search?q=${query.split(' ').join('+')}&source=lnms&tbm=isch`,
            '_blank',
            'noopener,noreferrer')
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
                    <PopoverHandler>
                        <Button variant="outlined"
                                color='purple'
                                size='sm'
                                className='my-2 py-0'
                                placeholder={undefined}
                        >Intro</Button>
                    </PopoverHandler>
                    <PopoverContent className="z-20 bg-yellow-100 max-w-[300px]"
                                    placeholder={undefined}
                    >{article.intro}</PopoverContent>
                </Popover>}

                <Button variant="outlined"
                        color='purple'
                        size='sm'
                        className='my-1 py-0'
                        placeholder={undefined}
                        onClick={visitGoogle}
                ><GoogleIcon/></Button>

                <Button variant='outlined'
                        color='purple'
                        size='sm'
                        className='my-1 py-0'
                        type='button'
                        placeholder={undefined}
                        onClick={editArticle}
                ><SearchImageIcon/></Button>
            </div>
        </div>
    );
};

export default ArticleFooter;
