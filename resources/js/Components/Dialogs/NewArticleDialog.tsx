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
                placeholder={undefined}>
            <DialogHeader className='bg-green-50 rounded-t-2xl' placeholder={undefined}>Articol nou</DialogHeader>
            <DialogBody placeholder={undefined}>
                <div className='w-full flex flex-col justify-center items-center'>
                    <div className='w-full mb-3'>
                        <Input label='Titlu' size='lg' value={title} onChange={changeTitle} crossOrigin={undefined}/>
                    </div>
                    <div className='py-2 h-15 flex justify-around w-8/12'>
                        <Radio id='BETA'
                               name='article_type'
                               value='BETA'
                               label='BETA'
                               checked={newArticleType === 'BETA'}
                               crossOrigin={undefined}
                               onChange={changeType}/>
                        <Radio id='OFF'
                               name='article_type'
                               value='OFF'
                               label='OFF'
                               checked={newArticleType === 'OFF'}
                               crossOrigin={undefined}
                               onChange={changeType}/>
                        <Radio id='LIVE'
                               name='article_type'
                               value='LIVE'
                               label='LIVE'
                               checked={newArticleType === 'LIVE'}
                               crossOrigin={undefined}
                               onChange={changeType}/>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter placeholder={undefined}>
                <Button color='green'
                        size='sm'
                        placeholder={undefined}
                >Save</Button>
                <Button variant='outlined'
                        size='sm'
                        className='ml-4'
                        onClick={handleDialog}
                        placeholder={undefined}
                >Cancel</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default NewArticleDialog;
