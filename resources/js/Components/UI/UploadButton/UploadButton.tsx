import React, {ChangeEvent} from 'react';
import {ArrowUpTrayIcon} from '@heroicons/react/24/outline';

interface UploadButtonProps {
    title?: string
    description?: string
    accept?: string
    multiple?: boolean
    handleChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

const UploadButton = ({
    title = 'Încarcă fișier',
    description = 'Alege un fișier de pe dispozitiv',
    accept,
    multiple = false,
    handleChange,
}: UploadButtonProps) => (
    <label className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#2878ff]/30 bg-white/35 px-5 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:border-[#2878ff]/60 hover:bg-white/55 focus-within:ring-4 focus-within:ring-[#2878ff]/15">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#29b7e8] via-[#347cf4] to-[#7059ee] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_9px_22px_rgba(53,104,224,0.24)] transition group-hover:-translate-y-1">
            <ArrowUpTrayIcon className="h-6 w-6" strokeWidth={2}/>
        </span>
        <span className="text-sm font-semibold text-[#286ee7]">{title}</span>
        <span className="mt-1 text-xs leading-5 text-[#65728a]">{description}</span>
        <input type="file" className="sr-only" accept={accept} multiple={multiple} onChange={handleChange}/>
    </label>
);

export default UploadButton;
