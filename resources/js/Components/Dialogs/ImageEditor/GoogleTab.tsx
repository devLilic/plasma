import React, {ChangeEvent, useEffect, useState} from 'react';
import {CheckIcon} from '@heroicons/react/24/solid';
import {LinkIcon, ScissorsIcon} from '@heroicons/react/24/outline';
import {PercentCrop} from 'react-image-crop';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {useActions} from '@/Hooks/useActions';
import CropBlock from '@/Components/Dialogs/ImageEditor/Crop/CropBlock';
import SearchExternalImages from '@/Components/ExternalImages/SearchExternalImages';
import {openGoogleImagesSearch} from '@/Components/ExternalImages/SearchExternalImages';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@/Store/store';
import {cropExternalImage as cropExternalImageThunk} from '@/Store/image/externalImage.slice';
import {Article} from '@/types';

interface GoogleTabProps {
    article: Article
    onImageSelected: () => void
}

const GoogleTab = ({article, onImageSelected}: GoogleTabProps) => {
    const {resetCrop, setExternalUrlLink, changeSearchBy} = useActions();
    const dispatch = useDispatch<AppDispatch>();
    const {error, loading, selected} = useTypedSelector(state => state.externalImages);
    const [titleQuery, setTitleQuery] = useState(article.title);
    const [subtitleQuery, setSubtitleQuery] = useState(article.subtitle);
    const searchValue = article.search_by === 'title' ? titleQuery : subtitleQuery;
    const [tags, setTags] = useState(article.subtitle.replace(/\s?off|\s?snc/gi, '').toLowerCase());
    const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);
    const [imageDimensionsError, setImageDimensionsError] = useState(false);
    const [percentCrop, setPercentCrop] = useState<PercentCrop>({unit: '%', x: 0, y: 0, width: 0, height: 0});

    useEffect(() => {
        resetCrop();
        setTags(article.subtitle.replace(/\s?off|\s?snc/gi, '').toLowerCase());
    }, [article.id]);

    useEffect(() => {
        setTitleQuery(article.title);
        setSubtitleQuery(article.subtitle);
    }, [article.id, article.title, article.subtitle]);

    useEffect(() => setImageDimensionsError(false), [selected.url]);

    const saveCrop = async () => {
        if (!selected.url) return;
        try {
            await dispatch(cropExternalImageThunk({url: selected.url, section: percentCrop, tags, article_id: article.id})).unwrap();
            resetCrop();
            onImageSelected();
        } catch {
            // Error state is displayed below the URL field.
        }
    };

    const searchField = (kind: 'title' | 'subtitle', value: string, onChange: (event: ChangeEvent<HTMLInputElement>) => void) => {
        const active = article.search_by === kind;
        return (
            <div className={`flex items-center gap-3 rounded-2xl border p-3 transition ${active ? 'border-[#2878ff]/25 bg-[#2878ff]/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]' : 'border-white/60 bg-white/28'}`}>
                <button type="button" aria-label={kind === 'title' ? 'Folosește titlul pentru căutare' : 'Folosește subtitlul pentru căutare'} onClick={() => {
                    changeSearchBy({id: article.id, changes: {search_by: kind}});
                    if (!active && value.trim()) openGoogleImagesSearch(value);
                }} className="shrink-0">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-[#2878ff] bg-[#2878ff] text-white shadow-sm' : 'border-[#9ba8bb] bg-white/70'}`}>{active && <CheckIcon className="h-3 w-3"/>}</span>
                </button>
                <input aria-label={kind === 'title' ? 'Termen de căutare după titlu' : 'Termen de căutare după subtitlu'} value={value} onChange={onChange} onKeyDown={event => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    changeSearchBy({id: article.id, changes: {search_by: kind}});
                    const query = event.currentTarget.value.trim();
                    if (query) openGoogleImagesSearch(query);
                }} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-[#172033] outline-none ring-0 focus:ring-0"/>
            </div>
        );
    };

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <section className="min-w-0 rounded-[22px] border border-white/70 bg-white/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] sm:p-5">
                {selected.url ? (
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#172033]"><ScissorsIcon className="h-5 w-5 text-[#286ee7]"/>Decupează la formatul 16:9</div>
                        <div className="overflow-hidden rounded-none bg-black/5"><CropBlock url={selected.url} handlePercentCropChange={setPercentCrop} handleImageDimensionsChange={setImageDimensions} handleImageLoadError={() => setImageDimensionsError(true)}/></div>
                    </div>
                ) : (
                    <div>
                        <p className="mb-3 text-sm font-semibold text-[#172033]">Termen pentru căutare</p>
                        <div className="space-y-2.5">
                            {searchField('title', titleQuery, event => setTitleQuery(event.target.value))}
                            {searchField('subtitle', subtitleQuery, event => setSubtitleQuery(event.target.value))}
                        </div>
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/48 px-4 py-3 shadow-sm">
                            <span className="min-w-0 flex-1 truncate text-sm text-[#65728a]">{searchValue}</span>
                            <SearchExternalImages query={searchValue}/>
                        </div>
                    </div>
                )}
            </section>

            <aside className="min-w-0 flex flex-col rounded-[22px] border border-white/75 bg-white/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] sm:p-5">
                <label>
                    <span className="auth-field-label flex items-center gap-2"><LinkIcon className="h-4 w-4"/>URL imagine</span>
                    <input value={selected.url} onChange={event => setExternalUrlLink(event.target.value)} placeholder="Lipește adresa imaginii" className="ios-search !pl-4"/>
                    {selected.url && <p className="mt-2 text-xs text-[#65728a]" aria-live="polite">
                        {imageDimensions
                            ? <>Dimensiuni detectate: {imageDimensions.width} × {imageDimensions.height} px</>
                            : imageDimensionsError ? 'Dimensiunile nu au putut fi detectate din acest link.' : 'Se detectează dimensiunile imaginii…'}
                    </p>}
                    {error && <p role="alert" className="mt-2 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-xs text-[#ff3b30]">{error}</p>}
                </label>
                {selected.url ? (
                    <>
                        <label className="mt-4">
                            <span className="auth-field-label">Etichete</span>
                            <input value={tags} onChange={event => setTags(event.target.value)} placeholder="separate prin virgulă" className="ios-search !pl-4"/>
                        </label>
                        <button type="button" onClick={saveCrop} disabled={loading} className="ios-primary-button mt-auto pt-3 disabled:cursor-wait disabled:opacity-60">{loading ? 'Se salvează…' : 'Salvează imaginea'}</button>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
                        <LinkIcon className="mb-3 h-9 w-9 text-[#9aa8bc]"/>
                        <p className="text-sm font-semibold text-[#172033]">Lipește linkul imaginii</p>
                        <p className="mt-1 text-xs leading-5 text-[#65728a]">Imaginea va putea fi decupată înainte de salvare.</p>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default GoogleTab;
