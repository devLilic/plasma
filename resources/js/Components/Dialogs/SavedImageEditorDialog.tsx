import React, {useEffect, useState} from 'react';
import {ExclamationTriangleIcon, ScissorsIcon, TagIcon, TrashIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {PercentCrop} from 'react-image-crop';
import {useDispatch} from 'react-redux';
import Dialog from '@/Components/Material/Dialog';
import DialogHeader from '@/Components/Material/DialogHeader';
import DialogBody from '@/Components/Material/DialogBody';
import DialogFooter from '@/Components/Material/DialogFooter';
import CropBlock from '@/Components/Dialogs/ImageEditor/Crop/CropBlock';
import TagEditor from '@/Components/LocalImages/TagEditor';
import {Image} from '@/types';
import {AppDispatch} from '@/Store/store';
import {removeImage, updateImage} from '@/Store/image/image.slice';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface Props {
    image: Image | null;
    isOpen: boolean;
    onClose: () => void;
}

type Section = 'tags' | 'crop';
const emptyCrop: PercentCrop = {unit: '%', x: 0, y: 0, width: 0, height: 0};

export default function SavedImageEditorDialog({image, isOpen, onClose}: Props) {
    const [section, setSection] = useState<Section>('tags');
    const [tagTitles, setTagTitles] = useState<string[]>([]);
    const [crop, setCrop] = useState<PercentCrop>(emptyCrop);
    const [saving, setSaving] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [error, setError] = useState('');
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        setSection('tags');
        setTagTitles(image?.tags.map(tag => tag.title) ?? []);
        setCrop(emptyCrop);
        setSaving(false);
        setConfirmingDelete(false);
        setError('');
    }, [image, isOpen]);

    const saveTags = async () => {
        if (!image) return;
        setSaving(true);
        setError('');
        try {
            await dispatch(updateImage({id: image.id, tags: tagTitles.join(',')})).unwrap();
            onClose();
        } catch (message: any) {
            setError(typeof message === 'string' ? message : 'Etichetele nu au putut fi actualizate.');
        } finally {
            setSaving(false);
        }
    };

    const saveCrop = async () => {
        if (!image?.sourceUrl) return;
        if (!crop.width || !crop.height) {
            setError('Așteaptă încărcarea imaginii sursă înainte de salvare.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await dispatch(updateImage({id: image.id, section: crop})).unwrap();
            onClose();
        } catch (message: any) {
            setError(typeof message === 'string' ? message : 'Zona de crop nu a putut fi actualizată.');
        } finally {
            setSaving(false);
        }
    };

    const deleteImage = async () => {
        if (!image) return;
        setSaving(true);
        setError('');
        try {
            await dispatch(removeImage(image.id)).unwrap();
            onClose();
        } catch {
            setError('Imaginea nu a putut fi ștearsă.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog size="lg" open={isOpen} handler={onClose} className="saved-image-dialog !w-[calc(100%_-_1.5rem)]">
            <DialogHeader className="!flex !items-center !justify-between !border-[#5878a8]/10 !bg-white/28">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#286ee7]">Biblioteca media</p>
                    <h2 className="mt-1 text-lg font-bold tracking-[-0.025em]">{confirmingDelete ? 'Șterge imaginea' : 'Editează imaginea'}</h2>
                </div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/90 bg-white/55 text-[#49617f] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_5px_16px_rgba(44,73,119,0.09)] transition hover:bg-white/90 hover:text-[#14213d]" aria-label="Închide"><XMarkIcon className="h-4 w-4"/></button>
            </DialogHeader>

            {confirmingDelete ? (
                <>
                    <DialogBody>
                        <div className="mx-auto max-w-lg py-6 text-center">
                            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/70 bg-[#ff3b30]/10 text-[#e13d37] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_22px_rgba(201,55,48,0.12)]"><ExclamationTriangleIcon className="h-8 w-8"/></span>
                            <h3 className="text-xl font-bold text-[#172033]">Ștergere definitivă</h3>
                            <p className="mt-2 text-sm leading-6 text-[#65728a]">Fișierul și toate asocierile imaginii cu materialele și etichetele vor fi eliminate. Etichetele globale rămân disponibile în baza de date.</p>
                            {error && <p className="mt-4 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}
                        </div>
                    </DialogBody>
                    <DialogFooter className="!justify-end">
                        <button type="button" className="ios-secondary-button" onClick={() => setConfirmingDelete(false)}>Renunță</button>
                        <button type="button" disabled={saving} onClick={deleteImage} className="inline-flex min-h-11 items-center justify-center rounded-[15px] border border-white/25 bg-gradient-to-br from-[#ff6259] to-[#dc332d] px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_rgba(208,51,45,0.22)] disabled:opacity-50">{saving ? 'Se șterge…' : 'Șterge definitiv'}</button>
                    </DialogFooter>
                </>
            ) : (
                <>
                    <DialogBody className="!min-h-0 !overflow-y-auto !px-5 !py-5 sm:!px-6">
                        <div className="mb-5 inline-flex rounded-[17px] border border-white/85 bg-[#dcecff]/55 p-1 shadow-[inset_0_1px_2px_rgba(48,85,143,0.08),0_5px_18px_rgba(45,82,140,0.06)]">
                            <button type="button" onClick={() => {setSection('tags'); setError('');}} className={`flex items-center gap-2 rounded-[13px] px-4 py-2 text-sm font-semibold transition ${section === 'tags' ? 'bg-white/95 text-[#2267d9] shadow-[0_5px_16px_rgba(45,82,140,0.12)] ring-1 ring-white' : 'text-[#526b8c] hover:bg-white/45 hover:text-[#14213d]'}`}><TagIcon className="h-4 w-4"/>Etichete</button>
                            {image?.sourceUrl && <button type="button" onClick={() => {setSection('crop'); setError('');}} className={`flex items-center gap-2 rounded-[13px] px-4 py-2 text-sm font-semibold transition ${section === 'crop' ? 'bg-white/95 text-[#2267d9] shadow-[0_5px_16px_rgba(45,82,140,0.12)] ring-1 ring-white' : 'text-[#526b8c] hover:bg-white/45 hover:text-[#14213d]'}`}><ScissorsIcon className="h-4 w-4"/>Recrop</button>}
                        </div>

                        {section === 'tags' ? (
                            <div className="grid items-stretch gap-5 md:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]">
                                <div className="saved-image-preview flex aspect-video min-h-0 w-full items-center justify-center overflow-hidden rounded-[24px]">
                                    <div className="saved-image-preview__inner">
                                        <ImageWithLoader src={image?.url} alt="Imagine editată" containerClassName="h-full w-full"/>
                                    </div>
                                </div>
                                <section className="saved-tag-panel min-w-0 rounded-[24px] p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-[#32b8e8] to-[#5570ee] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_7px_18px_rgba(50,103,211,0.2)]"><TagIcon className="h-5 w-5"/></span>
                                            <div>
                                                <h3 className="font-bold tracking-[-0.015em] text-[#14213d]">Etichetele imaginii</h3>
                                                <p className="mt-1 text-sm leading-5 text-[#4f6481]">Organizează imaginea pentru căutare rapidă.</p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 rounded-full border border-white/80 bg-white/55 px-2.5 py-1 text-xs font-bold text-[#426087]">{tagTitles.length}</span>
                                    </div>
                                    <div className="mt-5">
                                    {image && <TagEditor initialTags={image.tags} onChange={setTagTitles}/>} 
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="flex flex-col items-stretch gap-5 md:flex-row md:items-start">
                                <div className="flex w-full shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white/30 p-2 shadow-inner md:w-1/2" style={{maxHeight: 'min(48dvh, 520px)'}}>
                                    {image?.sourceUrl && <CropBlock url={image.sourceUrl} handlePercentCropChange={setCrop} maxHeight="min(48dvh, 504px)"/>}
                                </div>
                                <section className="min-w-0 flex-1 rounded-[22px] border border-white/75 bg-white/48 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
                                    <h3 className="flex items-center gap-2 font-semibold text-[#172033]"><ScissorsIcon className="h-5 w-5 text-[#286ee7]"/>Decupare 16:9</h3>
                                    <p className="mt-1 text-sm leading-6 text-[#65728a]">Repoziționează sau redimensionează zona selectată. Etichetele imaginii nu vor fi modificate.</p>
                                    {image?.sourceUrl && <p className="mt-4 break-all rounded-xl bg-[#2878ff]/[0.06] px-3 py-2 text-xs leading-5 text-[#3764be]">Sursă: {image.sourceUrl}</p>}
                                </section>
                            </div>
                        )}
                        {error && <p className="mt-4 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}
                    </DialogBody>
                    <DialogFooter className="!justify-between !border-[#5878a8]/10 !bg-white/30">
                        <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex min-h-10 items-center gap-2 rounded-[14px] border border-[#d84a42]/15 bg-[#fff4f2]/80 px-3.5 text-sm font-bold text-[#a62f29] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(168,54,47,0.07)] transition hover:border-[#d84a42]/25 hover:bg-[#ffe9e6]"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#d84a42]/10"><TrashIcon className="h-3.5 w-3.5"/></span>Șterge imaginea</button>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="ios-secondary-button">Renunță</button>
                            <button type="button" onClick={section === 'tags' ? saveTags : saveCrop} disabled={saving || !image} className="ios-primary-button disabled:opacity-60">{saving ? 'Se salvează…' : section === 'tags' ? 'Salvează etichetele' : 'Salvează crop-ul'}</button>
                        </div>
                    </DialogFooter>
                </>
            )}
        </Dialog>
    );
}
