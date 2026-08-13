import React, {ChangeEvent, useState} from 'react';
import {CheckCircleIcon} from '@heroicons/react/24/outline';
import axios from 'axios';
import UploadButton from '@/Components/UI/UploadButton/UploadButton';
import {useActions} from '@/Hooks/useActions';

interface UploadTabProps {
    handleModal: () => void
}

const UploadTab = ({}: UploadTabProps) => {
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(0);
    const [error, setError] = useState('');
    const {fetchImages} = useActions();

    const upload = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/'));
        if (!files.length) {
            setError('Selectează cel puțin o imagine validă.');
            return;
        }
        setUploading(true);
        setUploaded(0);
        setError('');
        const formData = new FormData();
        files.forEach(file => formData.append('files[]', file));
        try {
            await axios.post('/api/v1/files', formData, {headers: {'Content-Type': 'multipart/form-data'}});
            setUploaded(files.length);
            fetchImages();
        } catch {
            setError('Imaginile nu au putut fi încărcate. Încearcă din nou.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mx-auto max-w-xl py-4 sm:py-10">
            <UploadButton title={uploading ? 'Se încarcă…' : 'Alege imagini'} description="JPG, PNG sau WebP • maximum 10 MB per imagine" accept="image/jpeg,image/png,image/webp" multiple handleChange={upload}/>
            {uploaded > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#34c759]/10 px-4 py-3 text-sm font-medium text-[#248a3d]">
                    <CheckCircleIcon className="h-5 w-5"/>{uploaded} {uploaded === 1 ? 'imagine încărcată' : 'imagini încărcate'} în bibliotecă
                </div>
            )}
            {error && <p className="mt-4 rounded-2xl bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#ff3b30]">{error}</p>}
        </div>
    );
};

export default UploadTab;
