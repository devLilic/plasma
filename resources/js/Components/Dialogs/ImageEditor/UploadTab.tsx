import React from 'react';
import UploadButton from "@/Components/UI/UploadButton/UploadButton";

// import UploadForm from "@/Shared/ImagesUpload/UploadForm";

interface UploadTabProps {
    handleModal: () => void
}

const UploadTab = ({handleModal}: UploadTabProps) => {
    return (
        <div>
            <form className='max-w-[300px] mx-auto mt-4'>
                <UploadButton title='Încarcă imagini'/>
            </form>
        </div>
    );
};

export default UploadTab;
