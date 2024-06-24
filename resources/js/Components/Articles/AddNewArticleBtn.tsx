import React from 'react';
import {Button} from "@material-tailwind/react";
import {useActions} from "@/Hooks/useActions";
import {useTypedSelector} from "@/Hooks/useTypedSelector";

interface AddNewArticleBtnProps {
    handleDialog: ()=>void,
    articleID?: number
}

const AddNewArticleBtn = ({handleDialog, articleID}: AddNewArticleBtnProps) => {
    const {changeNewArticlePosition} = useActions()

    const article_order = articleID ? useTypedSelector(state => state.articles.entities[articleID].playlist_order) : 0
    const handleNwArticleBtn = () => {
        changeNewArticlePosition(article_order+1)
        handleDialog()
    }

    return (
        <Button
            onClick={handleNwArticleBtn}
            className='text-white maz
            flex items-center
            p-0
            my-5
            border-white border-2 hover:border-purple-500
            rounded-lg text-xs bg-purple-500 hover:cursor-pointer'
            placeholder={undefined}>+</Button>
    );
};

export default AddNewArticleBtn;
