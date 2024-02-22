import React from 'react';
import {Button} from "@material-tailwind/react";
import {addNewArticle} from "@/Store/article/article.slice";

interface AddNewArticleBtnProps {
    position: number,
    handleDialog: ()=>void
}

const AddNewArticleBtn = ({position, handleDialog}: AddNewArticleBtnProps) => {
    return (
        <Button
            onClick={()=> handleDialog()}
            className='text-white
            flex items-center
            p-0
            my-5
            border-white border-2 hover:border-purple-500
            rounded-lg text-xs bg-purple-500 hover:cursor-pointer'
            placeholder={undefined}>+</Button>
    );
};

export default AddNewArticleBtn;
