import React, {ChangeEvent, useState} from 'react';
import Dialog from "@/Components/UI/Dialog";
import {Input, Radio} from "@material-tailwind/react";

interface NewArticleDialogProps {
    isDialogOpen: boolean
    handleDialogOpen: () => void
}

const NewArticleDialog = ({isDialogOpen, handleDialogOpen}: NewArticleDialogProps) => {
    const [title, setTitle] = useState('')
    const [newArticleType, setNewArticleType] = useState('BETA')

    const changeTitle = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(prevState => e.target.value)
    }

    const changeType = (e: ChangeEvent<HTMLInputElement>) => {
        setNewArticleType(prevState => e.target.value)
    }

    const resetForm = () => {
        setNewArticleTitle('')
        setNewArticleType('BETA')
    }

    const saveNewArticle = () => {
        saveArticle(newArticleTitle, newArticleType)
        handleDialog()
        resetForm()

    }
    return (
        <Dialog size="sm"
                open={isDialogOpen}
                handleDialog={handleDialogOpen}
                title="Articol Nou"
                confirmBtn={true}
                confirmText='Save'
                confirmAction={saveNewArticle}
                cancelBtn={true}
        >
            <div className='w-full flex flex-col justify-center items-center'>
                <div className='w-full mb-3'>
                    <Input label='Titlu' size='lg' value={newArticleTitle} onChange={changeTitle}/>
                </div>
                <div className='py-2 h-15 flex justify-around w-8/12'>
                    <Radio id='BETA'
                           name='article_type'
                           value='BETA'
                           label='BETA'
                           checked={newArticleType === 'BETA'}
                           onChange={changeType}
                    />
                    <Radio id='OFF'
                           name='article_type'
                           value='OFF'
                           label='OFF'
                           checked={newArticleType === 'OFF'}
                           onChange={changeType}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default NewArticleDialog;
