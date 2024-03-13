import React from 'react';
import Dialog from "@/Components/Material/Dialog";
import DialogHeader from "@/Components/Material/DialogHeader";
import DialogBody from "@/Components/Material/DialogBody";
import DialogFooter from "@/Components/Material/DialogFooter";
import Button from "@/Components/Material/Button";

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
                handler={handleDialog}>
            <DialogHeader className='bg-green-50 rounded-t-2xl'>Confirmă</DialogHeader>
            <DialogBody>
                <div className='w-full flex flex-col justify-center '>
                    Dorești să ștergi?
                </div>
            </DialogBody>
            <DialogFooter className='items-center flex justify-center'>
                <Button color='red'
                        size='sm'
                        onClick={confirmAction}
                >Da</Button>
                <Button variant='outlined'
                        size='sm'
                        className='ml-4'
                        onClick={cancelAction}
                >Renunță</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ConfirmDialog;
