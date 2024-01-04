import React, {ChangeEvent} from "react";
import UploadSvg from "@/Components/UI/UploadButton/UploadSvg";

interface UploadButtonProps{
    title: string
    handleChange: (e: ChangeEvent<HTMLFormElement>)=>void
}

const UploadButton = ({title, handleChange}: UploadButtonProps) => {
    const labelClasses = "flex items-center px-4 py-2 bg-white rounded-lg tracking-wide uppercase border border-blue cursor-pointer shadow-xl hover:shadow-lg text-blue-600 bg-white border-blue-600";
    return (
        <label className={labelClasses}>
            <UploadSvg/>
            <span className='ml-2'>{title}</span>
            <input type="file" className="hidden" onChange={handleChange}/>
        </label>
    )
}

export default UploadButton;
