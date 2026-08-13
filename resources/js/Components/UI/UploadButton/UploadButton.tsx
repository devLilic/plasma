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
    <label className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-[#007aff]/35 bg-[#007aff]/[0.055] px-5 py-7 text-center transition hover:border-[#007aff] hover:bg-[#007aff]/10 focus-within:ring-4 focus-within:ring-[#007aff]/15">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007aff] text-white shadow-[0_7px_20px_rgba(0,122,255,0.22)] transition group-hover:-translate-y-0.5">
            <ArrowUpTrayIcon className="h-6 w-6" strokeWidth={2}/>
        </span>
        <span className="text-sm font-semibold text-[#007aff]">{title}</span>
        <span className="mt-1 text-xs leading-5 text-[#8e8e93]">{description}</span>
        <input type="file" className="sr-only" accept={accept} multiple={multiple} onChange={handleChange}/>
    </label>
);

export default UploadButton;
