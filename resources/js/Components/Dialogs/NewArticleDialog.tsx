import React, {ChangeEvent, useState} from 'react';
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Input, Radio} from "@material-tailwind/react";

interface NewArticleDialogProps {
    isOpen: boolean
    handleDialog: () => void
}

const NewArticleDialog = ({isOpen, handleDialog}: NewArticleDialogProps) => {
    const [title, setTitle] = useState('')
    const [newArticleType, setNewArticleType] = useState('BETA')

    const changeTitle = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(prevState => e.target.value)
    }

    const changeType = (e: ChangeEvent<HTMLInputElement>) => {
        setNewArticleType(prevState => e.target.value)
    }

    const resetForm = () => {
        setTitle('')
        setNewArticleType('BETA')
    }

    const saveNewArticle = () => {
        // saveArticle(title, newArticleType)
        handleDialog()
        resetForm()
    }
    return (
        <Dialog size="xs"
                open={isOpen}
                handler={handleDialog}
        >
            <DialogHeader className='bg-green-50 rounded-t-2xl'>Articol nou</DialogHeader>
            <DialogBody>
                <div className='w-full flex flex-col justify-center items-center'>
                    <div className='w-full mb-3'>
                        <Input label='Titlu' size='lg' value={title} onChange={changeTitle}/>
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
            </DialogBody>
            <DialogFooter>
                <Button color='green' size='sm'>Save</Button>
                <Button variant='outlined' size='sm' className='ml-4' onClick={handleDialog}>Cancel</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default NewArticleDialog;
