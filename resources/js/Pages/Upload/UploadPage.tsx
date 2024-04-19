import React, {ChangeEvent, useEffect, useState} from 'react';
import {PageProps} from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Head, useForm} from "@inertiajs/react";
import {Card} from "@material-tailwind/react";
import UploadButton from "@/Components/UI/UploadButton/UploadButton";
import {useActions} from "@/Hooks/useActions";

interface UploadPageProps extends PageProps {
}

const UploadPage = ({auth}: UploadPageProps) => {
    const [isFileTypeOK, setIsFileTypeOK] = useState(false);

    const {data, setData, post} = useForm({
        files: [],
    });

    useEffect(() => {
        if (isFileTypeOK) {
            post('api/files');
        }
    }, [isFileTypeOK])

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const selectedFiles = e.target.files;
        const images: File[] = data.files || []
        if(!selectedFiles){
            return
        }
        Array.from(selectedFiles).map(file => {
            if (file.type.startsWith('image/')) {
                images.push(file)
            }
        });

        setData('files', images);
        setTimeout(()=>{
            post("/api/v1/files")
        }, 500);
    }

    const {addFiles, uploadNewImageFiles} = useActions()

    const handleUploadAction = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            let formData = new FormData();
            selectedFiles.map((file: File) => {
                formData.append('files[]', file)
            })
            uploadNewImageFiles({files: formData})
        }
    }
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Upload"/>
            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1" placeholder={undefined}>
                    <div className='my-4 mx-4 flex flex-col items-center justify-around'>
                        <form className='w-[200px]'>
                            <UploadButton title='Încarcă imagini' handleChange={handleChange}/>
                        </form>
                        <div className='w-full'>
                            imagini
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default UploadPage;
