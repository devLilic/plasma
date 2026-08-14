import React, {ChangeEvent, useEffect, useState} from 'react';
import {Head, router, useForm} from '@inertiajs/react';
import {ArrowDownTrayIcon, MagnifyingGlassIcon, PhotoIcon} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UploadButton from '@/Components/UI/UploadButton/UploadButton';
import ListOfPlaylists from '@/Components/Playlist/ListOfPlaylists';
import TagsList from '@/Components/LocalImages/TagsList';
import {Article, Image, PageProps, PaginatedResource, Playlist} from '@/types';
import {useActions} from '@/Hooks/useActions';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectAllImages} from '@/Store/image/image.slice';
import SavedImageEditorDialog from '@/Components/Dialogs/SavedImageEditorDialog';
import Pagination from '@/Components/UI/Pagination';
import {imageFilename, saveImageAs} from '@/Utils/imageDownload';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface PlaylistPageProps extends PageProps {
    playlists?: Playlist[]
    articles?: Article[]
    images: PaginatedResource<Image>
    filters: {search: string}
}

const PlaylistPage = ({auth, playlists, articles, images, filters}: PlaylistPageProps) => {
    const [searchTag, setSearchTag] = useState(filters.search);
    const [uploadError, setUploadError] = useState('');
    const [editingImage, setEditingImage] = useState<Image | null>(null);
    const renderImages = useTypedSelector(selectAllImages);
    const {setArticles, setImages} = useActions();
    const {setData, post, processing} = useForm<{file: File | null}>({file: null});

    useEffect(() => {
        if (articles) setArticles(articles);
        setImages(images.data);
    }, [articles, images.data]);

    useEffect(() => {
        const search = searchTag.trim().length > 1 ? searchTag.trim() : '';
        if (search === filters.search) return;
        const timer = setTimeout(() => router.get(route('playlists.index'), search ? {search} : {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['images', 'filters'],
        }), 500);
        return () => clearTimeout(timer);
    }, [searchTag, filters.search]);

    const handlePlaylistUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const extensionIsHtml = /\.html?$/i.test(file.name);
        if (file.type !== 'text/html' && !extensionIsHtml) {
            setUploadError('Selectează un fișier HTML sau HTM valid.');
            return;
        }
        setUploadError('');
        setData('file', file);
        setTimeout(() => post(route('playlists.store')), 0);
    };

    const saveImage = (image: Image) => {
        const fileName = searchTag || image.tags.map(tag => tag.title).join('_') || `${image.id}_autosave`;
        saveImageAs(image.url, imageFilename(fileName));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Playlisturi"/>
            <div className="ios-page">
                <header className="ios-page-header">
                    <div>
                        <p className="ios-eyebrow">Workspace editorial</p>
                        <h1 className="ios-title">Construiește fiecare jurnal în ritmul tău.</h1>
                        <p className="ios-subtitle">Importă playlistul, caută vizualurile potrivite și continuă editarea fără să întrerupi fluxul.</p>
                    </div>
                </header>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <section className="ios-card overflow-hidden">
                        <div className="ios-card-header flex-col gap-4 sm:flex-row">
                            <div>
                                <h2 className="ios-section-title">Biblioteca media</h2>
                                <p className="mt-1 text-sm text-[#65728a]">Imagini recente și rezultate după etichete</p>
                            </div>
                            <div className="relative w-full sm:max-w-xs">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#7c899d]"/>
                                <input className="ios-search" value={searchTag} onChange={event => setSearchTag(event.target.value)} placeholder="Caută după etichetă"/>
                            </div>
                        </div>

                        {renderImages.length ? (
                            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                                {renderImages.map(image => (
                                    <article className="liquid-media-tile group relative overflow-hidden rounded-[20px]" key={image.id}>
                                        <button type="button" className="block w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2878ff]" onClick={() => setEditingImage(image)} aria-label="Editează imaginea">
                                            <ImageWithLoader src={image.thumbnailUrl} alt={image.tags?.map(tag => tag.title).join(', ') || 'Imagine media'} loading="lazy" decoding="async" containerClassName="aspect-[4/3] w-full" className="h-full w-full object-cover"/>
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
                            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                                <PhotoIcon className="mb-3 h-10 w-10 text-[#99a7bc]"/>
                                <p className="font-semibold text-[#172033]">Nu sunt imagini disponibile</p>
                                <p className="mt-1 text-sm text-[#65728a]">Încarcă imagini sau încearcă o altă căutare.</p>
                            </div>
                        )}
                        <Pagination pagination={images}/>
                    </section>

                    <aside className="space-y-5">
                        <section className="ios-card p-4">
                            <UploadButton title={processing ? 'Se procesează…' : 'Încarcă playlist'} description="Fișier xTELEJURNAL în format .HTM" accept=".htm,.html,text/html" handleChange={handlePlaylistUpload}/>
                            {uploadError && <p className="mt-3 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#ff3b30]">{uploadError}</p>}
                        </section>

                        <section className="ios-card overflow-hidden">
                            <div className="ios-card-header">
                                <div>
                                    <h2 className="ios-section-title">Activitate recentă</h2>
                                    <p className="mt-1 text-xs text-[#65728a]">Ultimele playlisturi importate</p>
                                </div>
                            </div>
                            <ListOfPlaylists playlists={playlists}/>
                        </section>
                    </aside>
                </div>
                <SavedImageEditorDialog image={editingImage} isOpen={editingImage !== null} onClose={() => setEditingImage(null)}/>
            </div>
        </AuthenticatedLayout>
    );
};

export default PlaylistPage;
