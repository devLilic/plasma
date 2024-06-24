import React, {ChangeEvent} from "react";
import UploadSvg from "@/Components/UI/UploadButton/UploadSvg";

interface UploadButtonProps{
    title?: string
    handleChange?: (e: ChangeEvent<HTMLInputElement>)=>void
}

const UploadButton = ({title, handleChange}: UploadButtonProps) => {
    const labelClasses = "flex items-center px-6 py-6 m-0 bg-red-50 rounded-lg tracking-wide " +
        "border border-2 shadow cursor-pointer hover:shadow-lg hover:text-white hover:bg-red-600 text-red-600 border-red-600 min-w-[200px]";
    return (
        <label className={labelClasses}>
            <UploadSvg/>
            <span className='ml-2'>{title}</span>
            <input type="file" className="hidden" multiple onChange={handleChange}/>
        </label>
    )
}

export default UploadButton;
