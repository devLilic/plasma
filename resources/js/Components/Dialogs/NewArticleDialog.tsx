import React, {ChangeEvent} from 'react';
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";
import Input from "@/Components/Material/Input";
import Radio from "@/Components/Material/Radio";
import Button from "@/Components/Material/Button";
import Dialog from "@/Components/Material/Dialog";
import DialogHeader from "@/Components/Material/DialogHeader";
import DialogBody from "@/Components/Material/DialogBody";
import DialogFooter from "@/Components/Material/DialogFooter";

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
                handler={handleDialog}>
            <DialogHeader className='bg-green-50 rounded-t-2xl'>Articol nou</DialogHeader>
            <DialogBody>
                <div className='w-full flex flex-col justify-center items-center'>
                    <div className='w-full mb-3'>
                        <Input label='Titlu'
                               size='lg'
                               value={newArticleTitle}
                               required={true}
                               autoFocus={true}
                               onChange={handleNewArticleTitle}/>
                    </div>
                    <div className='py-2 h-15 flex justify-around w-8/12'>
                        <Radio id='BETA'
                               name='article_type'
                               value='BETA'
                               label='BETA'
                               checked={newArticleType === 'BETA'}
                               onChange={handleNewArticleType}/>
                        <Radio id='OFF'
                               name='article_type'
                               value='OFF'
                               label='OFF'
                               checked={newArticleType === 'OFF'}
                               onChange={handleNewArticleType}/>
                        <Radio id='LIVE'
                               name='article_type'
                               value='LIVE'
                               label='LIVE'
                               checked={newArticleType === 'LIVE'}
                               onChange={handleNewArticleType}/>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button color='green'
                        size='sm'
                        onClick={saveNewArticle}
                >Save</Button>
                <Button variant='outlined'
                        size='sm'
                        className='ml-4'
                        onClick={cancelNewArticle}
                >Cancel</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default NewArticleDialog;
