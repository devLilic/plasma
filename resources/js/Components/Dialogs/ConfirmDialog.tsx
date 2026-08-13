import React from 'react';
import {ExclamationTriangleIcon} from '@heroicons/react/24/outline';
import Dialog from '@/Components/Material/Dialog';
import DialogBody from '@/Components/Material/DialogBody';
import DialogFooter from '@/Components/Material/DialogFooter';

interface ConfirmDialogProps {
    isOpen: boolean
    handleDialog: () => void
    confirmAction: () => void
    cancelAction: () => void
    title?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    processing?: boolean
}

const ConfirmDialog = ({
    isOpen,
    cancelAction,
    confirmAction,
    title = 'Ștergi materialul?',
    description = 'Această acțiune elimină materialul din playlist și nu poate fi anulată.',
    confirmLabel = 'Șterge',
    cancelLabel = 'Păstrează',
    processing = false,
}: ConfirmDialogProps) => (
    <Dialog size="xs" open={isOpen} handler={cancelAction}>
        <DialogBody className="!px-7 !pb-6 !pt-7 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff3b30]/10 text-[#ff3b30]">
                <ExclamationTriangleIcon className="h-7 w-7"/>
            </span>
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#1c1c1e]">{title}</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#8e8e93]">{description}</p>
        </DialogBody>
        <DialogFooter className="!grid !grid-cols-2">
            <button type="button" onClick={cancelAction} disabled={processing} className="ios-secondary-button !bg-white disabled:opacity-50">{cancelLabel}</button>
            <button type="button" onClick={confirmAction} disabled={processing} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff3b30] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9342b] focus:ring-4 focus:ring-[#ff3b30]/20 disabled:cursor-wait disabled:opacity-60">{processing ? 'Se șterge…' : confirmLabel}</button>
        </DialogFooter>
    </Dialog>
);

export default ConfirmDialog;
