import React from 'react';
import {Article} from "@/types";
import {Button} from "@material-tailwind/react";
import DeleteIcon from "@/Components/UI/Svg/DeleteIcon";
import {useActions} from "@/Hooks/useActions";

interface ArticleHeaderProps {
    id: number
    title: string
    article_type: Article["article_type"]
    confirm: () => void
}


const ArticleHeader = ({id, title, article_type, confirm}: ArticleHeaderProps) => {
    const {markForDelete} = useActions()
    const titleEdited = title.length > 30 ? title.slice(0, 40) + "..." : title

    const handleDeleteBtnClick = () => {
        markForDelete(id)
        confirm()
    }

    return (
        <div
            className={`w-full text-sm font-bold bg-purple-300 rounded-t-xl text-white flex justify-between items-center relative`}>
            <span
                className='text-4xl absolute text-purple-700 left-2 opacity-40'>{article_type === "OFF" ? "O" : "B"}</span>
            <div className='px-2 ml-8 text-xs h-[60px] flex items-center z-10 tracking-wider mr-3'>
                {titleEdited.toUpperCase()}
            </div>
            <Button variant='outlined'
                    placeholder={null}
                    onClick={handleDeleteBtnClick}
                    className='relative right-1 !overflow-visible top-0 outline-none border-0 z-20 text-xs p-2 m-0 hover:bg-red-400 text-blue-800 hover:text-white'
            ><DeleteIcon/></Button>
        </div>
    );
};

export default ArticleHeader;
