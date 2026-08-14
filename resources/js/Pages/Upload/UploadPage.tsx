import React, {ChangeEvent, useState} from 'react';
import {Head, Link, router} from '@inertiajs/react';
import {CheckCircleIcon, ChevronRightIcon, PhotoIcon} from '@heroicons/react/24/outline';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UploadButton from '@/Components/UI/UploadButton/UploadButton';
import {PageProps} from '@/types';

const UploadPage = ({auth}: PageProps) => {
    const [uploading, setUploading] = useState(false);
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/'));
        if (!files.length) {
            setError('Selectează cel puțin o imagine validă.');
            return;
        }

        setError('');
        setSelectedNames(files.map(file => file.name));
        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files[]', file));

        try {
            await axios.post('/api/v1/files', formData, {headers: {'Content-Type': 'multipart/form-data'}});
            router.visit(route('images.index'));
        } catch {
            setError('Imaginile nu au putut fi încărcate. Încearcă din nou.');
            setUploading(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Încarcă imagini"/>
            <div className="ios-page">
                <header className="ios-page-header mx-auto max-w-4xl">
                    <div>
                        <p className="ios-eyebrow">Import rapid</p>
                        <h1 className="ios-title">Adaugă imagini în bibliotecă.</h1>
                        <p className="ios-subtitle">Selectează unul sau mai multe fișiere, iar Plasma le pregătește pentru căutare și reutilizare.</p>
                    </div>
                </header>
                <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
                    <section className="ios-card p-5 sm:p-8">
                        <UploadButton title={uploading ? 'Se încarcă…' : 'Alege imagini'} description="JPG, PNG sau WebP • poți selecta mai multe fișiere" accept="image/jpeg,image/png,image/webp" multiple handleChange={handleChange}/>
                        {error && <p className="mt-4 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#ff3b30]">{error}</p>}
                        {selectedNames.length > 0 && (
                            <div className="mt-5 divide-y divide-[#71809a]/10 overflow-hidden rounded-2xl bg-white/45 ring-1 ring-white/70">
                                {selectedNames.map(name => (
                                    <div key={name} className="flex items-center gap-3 px-4 py-3">
                                        <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#34c759]"/>
                                        <span className="truncate text-sm font-medium text-[#172033]">{name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="ios-card h-fit overflow-hidden">
                        <div className="p-5">
                            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#34c759]/10 text-[#34c759]">
                                <PhotoIcon className="h-6 w-6"/>
                            </span>
                            <h2 className="ios-section-title">Biblioteca ta</h2>
                            <p className="mt-2 text-sm leading-6 text-[#65728a]">După încărcare, imaginile apar imediat în căutarea după etichete.</p>
                        </div>
                        <Link href={route('images.index')} className="flex items-center justify-between border-t border-[#71809a]/10 px-5 py-4 text-sm font-semibold text-[#286ee7] hover:bg-white/40">
                            Vezi toate imaginile<ChevronRightIcon className="h-4 w-4"/>
                        </Link>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default UploadPage;
