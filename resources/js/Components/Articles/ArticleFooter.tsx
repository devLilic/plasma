import React, {FC, MouseEventHandler} from 'react';
import {Button} from "@material-tailwind/react";
import GoogleIcon from "../UI/Svg/GoogleIcon";
import SearchImageIcon from "../UI/Svg/SearchImageIcon";

interface IArticleFooterProps {
    showIntro: MouseEventHandler<HTMLButtonElement>
    editArticle: () => void,
    isIntroDisplayed: boolean,
    content: string
    searchQuery: string,
    handleDialog: ()=>void
}

const ArticleFooter = ({
                           showIntro,
                           editArticle,
                           isIntroDisplayed,
                           content,
                           searchQuery,
                       }: IArticleFooterProps) => {

    const makeLinkQuery = (query) => {
        return `https://www.google.com/search?q=${query.split(' ').join('+')}&source=lnms&tbm=isch`
    }

    const visitGoogle = () => {
        const url = makeLinkQuery(searchQuery);
        window.open(url, '_blank', 'noopener,noreferrer')
        editArticle()
    }

    return (
        <div
            className='mb-3 px-2 flex flex-col items-center justify-center border-t border-blue-500 border-dashed pt-3'>
            <div className='flex justify-between w-full'>
                <Button variant="outlined"
                        size="sm"
                        onClick={showIntro}
                >Intro</Button>

                <Button variant="outlined" onClick={visitGoogle}>
                    <GoogleIcon/>
                </Button>

                <Button variant='outlined'
                        color='amber'
                        size='sm'
                        type='button'
                        onClick={editArticle}>
                    <SearchImageIcon/>
                </Button>
            </div>
            {isIntroDisplayed && <p className='mt-1'>{content}</p>}
        </div>
    );
};

export default ArticleFooter;
