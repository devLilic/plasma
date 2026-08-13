import React, {useEffect, useState} from 'react';
import {Head, Link, router} from '@inertiajs/react';
import {ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, PencilSquareIcon, PhotoIcon} from '@heroicons/react/24/outline';
import {saveAs} from 'file-saver';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TagsList from '@/Components/LocalImages/TagsList';
import {Image, PageProps, PaginatedResource} from '@/types';
import {useActions} from '@/Hooks/useActions';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllImages} from '@/Store/image/image.slice';
import SavedImageEditorDialog from '@/Components/Dialogs/SavedImageEditorDialog';
import Pagination from '@/Components/UI/Pagination';

interface ImagesPageProps extends PageProps {
    images: PaginatedResource<Image>
    filters: {search: string}
}

const ImagesPage = ({auth, images, filters}: ImagesPageProps) => {
    const [searchTag, setSearchTag] = useState(filters.search);
    const [editingImage, setEditingImage] = useState<Image | null>(null);
    const renderImages = useTypedSelector(selectAllImages);
    const {setImages} = useActions();

    useEffect(() => {
        setImages(images.data);
    }, [images.data]);

    useEffect(() => {
        const search = searchTag.trim().length > 1 ? searchTag.trim() : '';
        if (search === filters.search) return;
        const timer = setTimeout(() => router.get(route('images.index'), search ? {search} : {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['images', 'filters'],
        }), 500);
        return () => clearTimeout(timer);
    }, [searchTag, filters.search]);

    const saveImage = (image: Image) => {
        const fileName = searchTag || image.tags.map(tag => tag.title).join('_') || `${image.id}_autosave`;
        saveAs(image.url, `${fileName}.jpg`);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Imagini"/>
            <div className="ios-page">
                <section className="ios-card overflow-hidden">
                    <div className="ios-card-header flex-col gap-4 sm:flex-row">
                        <div>
                            <h2 className="ios-section-title">{images.meta.total} imagini</h2>
                            <p className="mt-1 text-sm text-[#8e8e93]">Selectează o imagine pentru a o descărca</p>
                        </div>
                        <div className="flex w-full items-center gap-3 sm:w-auto">
                            <div className="relative min-w-0 flex-1 sm:w-72">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#8e8e93]"/>
                                <input className="ios-search" value={searchTag} onChange={event => setSearchTag(event.target.value)} placeholder="Caută după etichetă"/>
                            </div>
                            <Link href={route('images.create')} className="ios-secondary-button shrink-0">
                                <ArrowUpTrayIcon className="h-4 w-4"/>Încarcă
                            </Link>
                        </div>
                    </div>

                    {renderImages.length ? (
                        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                            {renderImages.map(image => (
                                <article className="group relative overflow-hidden rounded-2xl bg-[#f2f2f7]" key={image.id}>
                                    <img src={image.url} alt={image.tags?.map(tag => tag.title).join(', ') || 'Imagine media'} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"/>
                                    <button type="button" className="ios-media-edit" onClick={() => setEditingImage(image)} aria-label="Editează imaginea">
                                        <PencilSquareIcon className="h-4 w-4"/>
                                    </button>
                                    <button type="button" className="ios-media-download group/download" onClick={() => saveImage(image)} aria-label="Descarcă imaginea">
                                        <ArrowDownTrayIcon className="h-4 w-4"/>
                                        <span className="ios-media-download-tooltip">Descarcă</span>
                                    </button>
                                    {image.tags?.length > 0 && <div className="flex flex-wrap gap-1.5 p-2.5"><TagsList tags={image.tags}/></div>}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <PhotoIcon className="mb-3 h-11 w-11 text-[#c7c7cc]"/>
                            <p className="font-semibold text-[#1c1c1e]">Nicio imagine găsită</p>
                            <p className="mt-1 text-sm text-[#8e8e93]">Încearcă o altă etichetă sau încarcă imagini noi.</p>
                        </div>
                    )}
                    <Pagination pagination={images}/>
                </section>
                <SavedImageEditorDialog image={editingImage} isOpen={editingImage !== null} onClose={() => setEditingImage(null)}/>
            </div>
        </AuthenticatedLayout>
    );
};

export default ImagesPage;
