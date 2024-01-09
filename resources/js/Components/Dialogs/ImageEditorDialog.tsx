import React from 'react';
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import {Article} from "@/types";

interface ImageEditorDialogProps {
    isOpen: boolean,
    handleDialog: () => void
    article: Article
}

const ImageEditorDialog = ({isOpen, handleDialog, article}: ImageEditorDialogProps) => {

    return (
        <Dialog size='xl' open={isOpen} handler={handleDialog}>
            <DialogHeader className='text-lg bg-gray-100 rounded-t-2xl'>
                <div>
                    <p>{article.title}</p>
                    <p className='text-sm mt-2'>{article.subtitle}</p>
                </div>
            </DialogHeader>
            <DialogBody className='border-t border-b'>{article.intro}</DialogBody>
            <DialogFooter>
                <Button size='sm'
                        onClick={handleDialog}
                        variant='outlined'>Close</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
