import React, {ChangeEvent} from 'react';
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Input, Radio} from "@material-tailwind/react";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {useActions} from "@/Hooks/useActions";

interface ConfirmDialogProps {
    isOpen: boolean
    handleDialog: () => void
    confirmAction: () => void
    cancelAction: () => void
}

const ConfirmDialog = ({isOpen, handleDialog, confirmAction, cancelAction}: ConfirmDialogProps) => {
    return (
        <Dialog size="xs"
                open={isOpen}
                handler={handleDialog}
                placeholder={undefined}>
            <DialogHeader className='bg-green-50 rounded-t-2xl' placeholder={undefined}>Confirma</DialogHeader>
            <DialogBody placeholder={undefined}>
                <div className='w-full flex flex-col justify-center items-center'>
                </div>
            </DialogBody>
            <DialogFooter placeholder={undefined}>
                <Button color='red'
                        size='sm'
                        onClick={confirmAction}
                        placeholder={undefined}
                >Confirm</Button>
                <Button variant='outlined'
                        size='sm'
                        className='ml-4'
                        onClick={cancelAction}
                        placeholder={undefined}
                >Cancel</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ConfirmDialog;
