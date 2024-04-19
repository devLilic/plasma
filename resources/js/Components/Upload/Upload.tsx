import React from 'react';
import UploadSvg from "@/Components/UI/UploadButton/UploadSvg";

interface UploadProps {
    title: string,
    multiple: boolean
    fileType: string
    handleResponse: () => void
}

const Upload = ({title, handleResponse, fileType, multiple = false}: UploadProps) => {
    const labelClasses = "flex items-center px-4 py-4 bg-white rounded-lg tracking-wide " +
        "border border-blue cursor-pointer hover:shadow-lg text-blue-600 bg-white border-blue-600 min-w-[200px]";
    return (
        <label className={labelClasses}>
            <UploadSvg/>
            <span className='ml-2'>{title}</span>
            <input type="file" className="hidden" multiple={multiple} onChange={handleResponse}/>
        </label>
    )
};

export default Upload;
