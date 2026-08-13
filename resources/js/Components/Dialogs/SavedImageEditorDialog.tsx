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
        <Dialog size="lg" open={isOpen} handler={onClose}>
            <DialogHeader className="!flex !items-center !justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#007aff]">Biblioteca media</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">{confirmingDelete ? 'Șterge imaginea' : 'Editează imaginea'}</h2>
                </div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2f7] text-[#8e8e93] hover:bg-[#e5e5ea]" aria-label="Închide"><XMarkIcon className="h-4 w-4"/></button>
            </DialogHeader>

            {confirmingDelete ? (
                <>
                    <DialogBody>
                        <div className="mx-auto max-w-lg py-6 text-center">
                            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff3b30]/10 text-[#ff3b30]"><ExclamationTriangleIcon className="h-8 w-8"/></span>
                            <h3 className="text-xl font-semibold text-[#1c1c1e]">Ștergere definitivă</h3>
                            <p className="mt-2 text-sm leading-6 text-[#6e6e73]">Fișierul și toate asocierile imaginii cu materialele și etichetele vor fi eliminate. Etichetele globale rămân disponibile în baza de date.</p>
                            {error && <p className="mt-4 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}
                        </div>
                    </DialogBody>
                    <DialogFooter className="!justify-end">
                        <button type="button" className="ios-secondary-button !bg-white" onClick={() => setConfirmingDelete(false)}>Renunță</button>
                        <button type="button" disabled={saving} onClick={deleteImage} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff3b30] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Se șterge…' : 'Șterge definitiv'}</button>
                    </DialogFooter>
                </>
            ) : (
                <>
                    <DialogBody className="!min-h-0 !overflow-y-auto">
                        <div className="mb-5 inline-flex rounded-xl bg-[#f2f2f7] p-1">
                            <button type="button" onClick={() => {setSection('tags'); setError('');}} className={`flex items-center gap-2 rounded-[9px] px-4 py-2 text-sm font-semibold transition ${section === 'tags' ? 'bg-white text-[#007aff] shadow-sm' : 'text-[#6e6e73]'}`}><TagIcon className="h-4 w-4"/>Etichete</button>
                            {image?.sourceUrl && <button type="button" onClick={() => {setSection('crop'); setError('');}} className={`flex items-center gap-2 rounded-[9px] px-4 py-2 text-sm font-semibold transition ${section === 'crop' ? 'bg-white text-[#007aff] shadow-sm' : 'text-[#6e6e73]'}`}><ScissorsIcon className="h-4 w-4"/>Recrop</button>}
                        </div>

                        {section === 'tags' ? (
                            <div className="flex items-start gap-5">
                                <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#f2f2f7] p-2" style={{width: '50%', maxWidth: '50%', maxHeight: 'calc(100vh - 300px)'}}>
                                    <img src={image?.url} alt="Imagine editată" style={{display: 'block', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: 'calc(100vh - 316px)', objectFit: 'contain'}}/>
                                </div>
                                <section className="min-w-0 flex-1 rounded-[20px] border border-[#e5e5ea] bg-white p-5">
                                    <h3 className="flex items-center gap-2 font-semibold text-[#1c1c1e]"><TagIcon className="h-5 w-5 text-[#007aff]"/>Etichetele imaginii</h3>
                                    <p className="mb-4 mt-1 text-sm text-[#8e8e93]">Adaugă, selectează sau elimină etichete fără a modifica imaginea.</p>
                                    {image && <TagEditor initialTags={image.tags} onChange={setTagTitles}/>} 
                                </section>
                            </div>
                        ) : (
                            <div className="flex items-start gap-5">
                                <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#f2f2f7] p-2" style={{width: '50%', maxWidth: '50%', maxHeight: 'calc(100vh - 300px)'}}>
                                    {image?.sourceUrl && <CropBlock url={image.sourceUrl} handlePercentCropChange={setCrop} maxHeight="calc(100vh - 316px)"/>}
                                </div>
                                <section className="min-w-0 flex-1 rounded-[20px] border border-[#e5e5ea] bg-white p-5">
                                    <h3 className="flex items-center gap-2 font-semibold text-[#1c1c1e]"><ScissorsIcon className="h-5 w-5 text-[#007aff]"/>Decupare 16:9</h3>
                                    <p className="mt-1 text-sm leading-6 text-[#8e8e93]">Repoziționează sau redimensionează zona selectată. Etichetele imaginii nu vor fi modificate.</p>
                                    {image?.sourceUrl && <p className="mt-4 break-all rounded-xl bg-[#007aff]/[0.06] px-3 py-2 text-xs leading-5 text-[#0066d6]">Sursă: {image.sourceUrl}</p>}
                                </section>
                            </div>
                        )}
                        {error && <p className="mt-4 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}
                    </DialogBody>
                    <DialogFooter className="!justify-between">
                        <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10"><TrashIcon className="h-4 w-4"/>Șterge imaginea</button>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="ios-secondary-button !bg-white">Renunță</button>
                            <button type="button" onClick={section === 'tags' ? saveTags : saveCrop} disabled={saving || !image} className="ios-primary-button disabled:opacity-60">{saving ? 'Se salvează…' : section === 'tags' ? 'Salvează etichetele' : 'Salvează crop-ul'}</button>
                        </div>
                    </DialogFooter>
                </>
            )}
        </Dialog>
    );
}
