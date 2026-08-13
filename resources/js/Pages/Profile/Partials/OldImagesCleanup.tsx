import React, {useState} from 'react';
import {ArchiveBoxXMarkIcon, CheckCircleIcon, ClockIcon, PhotoIcon} from '@heroicons/react/24/outline';
import {Image} from '@/types';
import {oldImagesApi} from '@/API/oldImages.api';
import TagsList from '@/Components/LocalImages/TagsList';
import ConfirmDialog from '@/Components/Dialogs/ConfirmDialog';

const formatDate = (value: string | null) => value
    ? new Intl.DateTimeFormat('ro-RO', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
    : 'Dată necunoscută';

const OldImagesCleanup = () => {
    const [images, setImages] = useState<Image[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [scanning, setScanning] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const scan = async () => {
        setScanning(true);
        setError('');
        setMessage('');
        try {
            const result = await oldImagesApi.scan();
            setImages(result);
            setSelectedIds(new Set(result.map(image => image.id)));
        } catch (requestError: any) {
            setError(requestError?.response?.data?.message ?? 'Imaginile vechi nu au putut fi scanate.');
        } finally {
            setScanning(false);
        }
    };

    const toggleImage = (id: number) => {
        setSelectedIds(current => {
            const next = new Set(current);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const clean = async () => {
        if (!selectedIds.size) return;
        setCleaning(true);
        setError('');
        try {
            const result = await oldImagesApi.clean([...selectedIds]);
            const deletedIds = new Set(result.deleted_ids);
            setImages(current => current?.filter(image => !deletedIds.has(image.id)) ?? []);
            setSelectedIds(new Set());
            setConfirmOpen(false);
            setMessage(`${result.deleted_ids.length} ${result.deleted_ids.length === 1 ? 'imagine a fost ștearsă' : 'imagini au fost șterse'}. Etichetele au fost păstrate.`);
        } catch (requestError: any) {
            setError(requestError?.response?.data?.message ?? 'Imaginile selectate nu au putut fi șterse.');
            setConfirmOpen(false);
        } finally {
            setCleaning(false);
        }
    };

    return (
        <section className="ios-card overflow-hidden">
            <div className="ios-card-header items-start gap-4">
                <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff9500]/10 text-[#ff9500]">
                        <ArchiveBoxXMarkIcon className="h-6 w-6"/>
                    </span>
                    <div>
                        <h2 className="ios-section-title">Curățarea imaginilor vechi</h2>
                        <p className="mt-1 text-sm leading-5 text-[#8e8e93]">Scanează imaginile care nu au fost utilizate de mai mult de două luni. Poți exclude orice imagine înainte de ștergere.</p>
                    </div>
                </div>
                <button type="button" onClick={scan} disabled={scanning || cleaning} className="ios-secondary-button shrink-0 disabled:cursor-wait disabled:opacity-60">
                    <ClockIcon className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`}/>
                    {scanning ? 'Scanning…' : 'Scan for old images'}
                </button>
            </div>

            {error && <p className="mx-5 mt-4 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#ff3b30]">{error}</p>}
            {message && <p className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-[#34c759]/10 px-4 py-3 text-sm text-[#248a3d]"><CheckCircleIcon className="h-5 w-5"/>{message}</p>}

            {images === null && !scanning && (
                <div className="flex min-h-40 flex-col items-center justify-center px-6 py-8 text-center">
                    <PhotoIcon className="mb-3 h-9 w-9 text-[#c7c7cc]"/>
                    <p className="text-sm font-semibold text-[#1c1c1e]">Scanarea nu a fost pornită</p>
                    <p className="mt-1 text-xs text-[#8e8e93]">Nicio imagine nu va fi ștearsă fără selectare și confirmare.</p>
                </div>
            )}

            {images !== null && (
                <>
                    <div className="flex items-center justify-between border-y border-[#e5e5ea] bg-[#f9f9fb] px-5 py-3">
                        <p className="text-sm font-medium text-[#1c1c1e]">{images.length} {images.length === 1 ? 'imagine găsită' : 'imagini găsite'} · {selectedIds.size} selectate</p>
                        {!!images.length && <button type="button" onClick={() => setSelectedIds(selectedIds.size === images.length ? new Set() : new Set(images.map(image => image.id)))} className="text-sm font-semibold text-[#007aff]">{selectedIds.size === images.length ? 'Deselectează toate' : 'Selectează toate'}</button>}
                    </div>

                    {images.length ? (
                        <div className="grid max-h-[520px] grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
                            {images.map(image => {
                                const selected = selectedIds.has(image.id);
                                return (
                                    <button key={image.id} type="button" onClick={() => toggleImage(image.id)} aria-pressed={selected} className={`group relative overflow-hidden rounded-2xl bg-[#f2f2f7] text-left transition ${selected ? 'ring-2 ring-[#007aff]' : 'opacity-65 hover:opacity-100'}`}>
                                        <img src={image.url} alt={image.tags.map(tag => tag.title).join(', ') || 'Imagine veche'} className="aspect-[4/3] w-full object-cover"/>
                                        <span className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? 'border-[#007aff] bg-[#007aff] text-white' : 'border-white bg-black/25 text-transparent'}`}><CheckCircleIcon className="h-4 w-4"/></span>
                                        <div className="space-y-2 p-3">
                                            <p className="text-xs font-medium text-[#6e6e73]">Ultima utilizare: {formatDate(image.lastUsedAt)}</p>
                                            {!!image.tags.length && <div className="flex flex-wrap gap-1.5"><TagsList tags={image.tags}/></div>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex min-h-40 flex-col items-center justify-center px-6 py-8 text-center">
                            <CheckCircleIcon className="mb-3 h-9 w-9 text-[#34c759]"/>
                            <p className="text-sm font-semibold text-[#1c1c1e]">Nu există imagini mai vechi de două luni</p>
                        </div>
                    )}

                    {!!images.length && (
                        <div className="flex justify-end border-t border-[#e5e5ea] p-5">
                            <button type="button" onClick={() => setConfirmOpen(true)} disabled={!selectedIds.size || cleaning} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff3b30] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9342b] disabled:cursor-not-allowed disabled:opacity-40">Clean old images</button>
                        </div>
                    )}
                </>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                handleDialog={() => setConfirmOpen(false)}
                cancelAction={() => setConfirmOpen(false)}
                confirmAction={clean}
                title="Ștergi imaginile selectate?"
                description={`${selectedIds.size} ${selectedIds.size === 1 ? 'imagine va fi eliminată' : 'imagini vor fi eliminate'} din storage și baza de date. Etichetele vor rămâne disponibile.`}
                confirmLabel="Clean old images"
                processing={cleaning}
            />
        </section>
    );
};

export default OldImagesCleanup;
