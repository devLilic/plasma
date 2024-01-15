import React from 'react';
import {Article} from "@/types";
import {Button} from "@material-tailwind/react";

interface ArticleHeaderProps {
    title: string
    article_type: Article["article_type"]
    openDialog: () => void
}


const ArticleHeader = ({title, article_type, openDialog}: ArticleHeaderProps) => {

    const titleEdited = title.length > 30 ? title.slice(0, 40) + "..." : title

    return (
        <div
            className={`text-sm font-bold bg-purple-300 rounded-t-xl text-white flex justify-between items-center relative`}>
            <span
                className='text-4xl absolute text-purple-700 left-2 opacity-40'>{article_type === "OFF" ? "O" : "B"}</span>
            <div className='px-2 ml-8 text-xs h-[60px] flex items-center z-10 tracking-wider'>
                {titleEdited.toUpperCase()}
            </div>
            <Button variant="text"
                    color='white'
                    title="Add new article"
                    className="mr-2 p-2 z-20"
                    onClick={openDialog}
                    placeholder={undefined}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
            </Button>
        </div>
    );
};

export default ArticleHeader;
