import React, {ChangeEvent} from 'react';
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Input, Radio} from "@material-tailwind/react";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";

interface NewArticleDialogProps {
    isOpen: boolean
    handleDialog: () => void
}

const NewArticleDialog = ({isOpen, handleDialog}: NewArticleDialogProps) => {
    const newArticleTitle = useTypedSelector(state => state.articles.article_new.title)
    const newArticleType = useTypedSelector(state => state.articles.article_new.articleType)
    const playlistId = useTypedSelector(state => state.articles.playlist_id)
    const newArticlePosition = useTypedSelector(state => state.articles.article_new.position)

    const {
        changeNewArticleTitle,
        changeNewArticleType,
        resetNewArticle,
        addNewArticle
    } = useActions();

    const handleNewArticleTitle = (e: ChangeEvent<HTMLInputElement>) => {
        changeNewArticleTitle(e.target.value.toUpperCase())
    }

    const handleNewArticleType = (e: ChangeEvent<HTMLInputElement>) => {
        changeNewArticleType(e.target.value as "BETA" | "OFF" | "LIVE")
    }

    const cancelNewArticle = () => {
        resetNewArticle()
        handleDialog()
    }

    const saveNewArticle = () => {
        if (newArticleTitle) {
            addNewArticle({
                title: newArticleTitle,
                articleType: newArticleType,
                position: newArticlePosition,
                playlist_id: playlistId
            })
            resetNewArticle()
            handleDialog()
        }
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
                        <Input label='Titlu'
                               size='lg'
                               value={newArticleTitle}
                               required={true}
                               autoFocus={true}
                               onChange={handleNewArticleTitle}
                               crossOrigin={undefined}/>
                    </div>
                    <div className='py-2 h-15 flex justify-around w-8/12'>
                        <Radio id='BETA'
                               name='article_type'
                               value='BETA'
                               label='BETA'
                               checked={newArticleType === 'BETA'}
                               crossOrigin={undefined}
                               onChange={handleNewArticleType}/>
                        <Radio id='OFF'
                               name='article_type'
                               value='OFF'
                               label='OFF'
                               checked={newArticleType === 'OFF'}
                               crossOrigin={undefined}
                               onChange={handleNewArticleType}/>
                        <Radio id='LIVE'
                               name='article_type'
                               value='LIVE'
                               label='LIVE'
                               checked={newArticleType === 'LIVE'}
                               crossOrigin={undefined}
                               onChange={handleNewArticleType}/>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter placeholder={undefined}>
                <Button color='green'
                        size='sm'
                        onClick={saveNewArticle}
                        placeholder={undefined}
                >Save</Button>
                <Button variant='outlined'
                        size='sm'
                        className='ml-4'
                        onClick={cancelNewArticle}
                        placeholder={undefined}
                >Cancel</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default NewArticleDialog;
