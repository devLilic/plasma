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
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/70 bg-[#ff3b30]/10 text-[#e13d37] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_22px_rgba(201,55,48,0.12)]">
                <ExclamationTriangleIcon className="h-7 w-7"/>
            </span>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#172033]">{title}</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#65728a]">{description}</p>
        </DialogBody>
        <DialogFooter className="!grid !grid-cols-2">
            <button type="button" onClick={cancelAction} disabled={processing} className="ios-secondary-button disabled:opacity-50">{cancelLabel}</button>
            <button type="button" onClick={confirmAction} disabled={processing} className="inline-flex min-h-11 items-center justify-center rounded-[15px] border border-white/25 bg-gradient-to-br from-[#ff6259] to-[#dc332d] px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_rgba(208,51,45,0.22)] transition hover:-translate-y-0.5 focus:ring-4 focus:ring-[#ff3b30]/20 disabled:cursor-wait disabled:opacity-60">{processing ? 'Se șterge…' : confirmLabel}</button>
        </DialogFooter>
    </Dialog>
);

export default ConfirmDialog;
