import React, {useState} from 'react';
import {Button, Popover, PopoverContent, PopoverHandler} from "@material-tailwind/react";
import {Article} from "@/types";
import GoogleIcon from "@/Components/UI/Svg/GoogleIcon";
import SearchImageIcon from "@/Components/UI/Svg/SearchImageIcon";

interface ArticleFooterProps {
    article: Article
    editArticle: () => void
}

const ArticleFooter = ({article, editArticle}: ArticleFooterProps) => {
    const [query, setQuery] = useState(article.title)
    const [showIntro, setShowIntro] = useState(false)

    const makeLinkQuery = (q: string) => {
        return `https://www.google.com/search?q=${q.split(' ').join('+')}&source=lnms&tbm=isch`
    }

    const visitGoogle = () => {
        const url = makeLinkQuery(query);
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    return (
        <div
            className='mb-3 px-2 flex flex-col items-center justify-center border-t border-blue-500 border-dashed pt-3'>
            <div className='flex justify-between w-full'>
                <Popover>
                    <PopoverHandler>
                        <Button variant="outlined"
                                color='purple'
                                className='my-1 py-0'
                                placeholder={undefined}
                        >Intro</Button>
                    </PopoverHandler>
                    <PopoverContent className="z-20 bg-yellow-100 max-w-[300px]"
                                    placeholder={undefined}
                    >{article.intro}</PopoverContent>
                </Popover>
                {/*<Button variant="outlined"*/}
                {/*        size="sm"*/}
                {/*        onClick={() => setShowIntro(prevState => !prevState)}*/}
                {/*>Intro</Button>*/}

                <Button variant="outlined"
                        color='purple'
                        className='my-1 py-0'
                        placeholder={undefined}
                        onClick={visitGoogle}
                ><GoogleIcon/></Button>

                <Button variant='outlined'
                        color='purple'
                        className='my-1 py-0'
                        type='button'
                        placeholder={undefined}
                        onClick={editArticle}
                ><SearchImageIcon/></Button>
            </div>
            <div className='relative w-full'>
                {showIntro &&
                    <p className='border border-purple-600 -ml-2 -mr-2 rounded-lg shadow-2xl z-50 px-2 py-1 mt-1 absolute top-0 left-0 bg-white'>{article.intro}</p>}
            </div>
        </div>
    );
};

export default ArticleFooter;
