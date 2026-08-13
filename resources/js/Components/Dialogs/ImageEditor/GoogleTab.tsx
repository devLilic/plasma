import React, {ChangeEvent, useEffect, useState} from 'react';
import {CheckIcon} from '@heroicons/react/24/solid';
import {LinkIcon, ScissorsIcon} from '@heroicons/react/24/outline';
import {PercentCrop} from 'react-image-crop';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {useActions} from '@/Hooks/useActions';
import CropBlock from '@/Components/Dialogs/ImageEditor/Crop/CropBlock';
import SearchExternalImages from '@/Components/ExternalImages/SearchExternalImages';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@/Store/store';
import {cropExternalImage as cropExternalImageThunk} from '@/Store/image/externalImage.slice';

interface GoogleTabProps {
    handleModal: () => void
}

const GoogleTab = ({handleModal}: GoogleTabProps) => {
    const {resetCrop, setExternalUrlLink, changeSearchBy, changeTitle, changeSubtitle} = useActions();
    const dispatch = useDispatch<AppDispatch>();
    const {error, loading, selected} = useTypedSelector(state => state.externalImages);
    const articleId = useTypedSelector(state => state.articles.current);
    const article = useTypedSelector(state => state.articles.entities[articleId]);
    const searchValue = article.search_by === 'title' ? article.title : article.subtitle;
    const [tags, setTags] = useState(article.subtitle.replace(/\s?off|\s?snc/gi, '').toLowerCase());
    const [percentCrop, setPercentCrop] = useState<PercentCrop>({unit: '%', x: 0, y: 0, width: 0, height: 0});

    useEffect(() => {
        resetCrop();
        setTags(article.subtitle.replace(/\s?off|\s?snc/gi, '').toLowerCase());
    }, [articleId]);

    const saveCrop = async () => {
        if (!selected.url) return;
        try {
            await dispatch(cropExternalImageThunk({url: selected.url, section: percentCrop, tags, article_id: articleId})).unwrap();
            handleModal();
        } catch {
            // Error state is displayed below the URL field.
        }
    };

    const searchField = (kind: 'title' | 'subtitle', value: string, onChange: (event: ChangeEvent<HTMLInputElement>) => void) => {
        const active = article.search_by === kind;
        return (
            <div className={`flex items-center gap-3 rounded-2xl border p-3 ${active ? 'border-[#007aff]/30 bg-[#007aff]/[0.055]' : 'border-transparent bg-[#f2f2f7]'}`}>
                <button type="button" aria-label={kind === 'title' ? 'Folosește titlul pentru căutare' : 'Folosește subtitlul pentru căutare'} onClick={() => changeSearchBy({id: article.id, changes: {search_by: kind}})} className="shrink-0">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-[#007aff] bg-[#007aff] text-white' : 'border-[#c7c7cc] bg-white'}`}>{active && <CheckIcon className="h-3 w-3"/>}</span>
                </button>
                <input aria-label={kind === 'title' ? 'Titlul materialului' : 'Subtitlul materialului'} value={value} onChange={onChange} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-[#1c1c1e] outline-none ring-0 focus:ring-0"/>
            </div>
        );
    };

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <section className="min-w-0 rounded-[20px] bg-[#f9f9fb] p-4 sm:p-5">
                {selected.url ? (
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1c1c1e]"><ScissorsIcon className="h-5 w-5 text-[#007aff]"/>Decupează la formatul 16:9</div>
                        <div className="overflow-hidden rounded-2xl bg-black/5"><CropBlock url={selected.url} handlePercentCropChange={setPercentCrop}/></div>
                    </div>
                ) : (
                    <div>
                        <p className="mb-3 text-sm font-semibold text-[#1c1c1e]">Termen pentru căutare</p>
                        <div className="space-y-2.5">
                            {searchField('title', article.title, event => changeTitle({id: article.id, changes: {title: event.target.value}}))}
                            {searchField('subtitle', article.subtitle, event => changeSubtitle({id: article.id, changes: {subtitle: event.target.value}}))}
                        </div>
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#e5e5ea] bg-white px-4 py-3">
                            <span className="min-w-0 flex-1 truncate text-sm text-[#6e6e73]">{searchValue}</span>
                            <SearchExternalImages query={searchValue}/>
                        </div>
                    </div>
                )}
            </section>

            <aside className="min-w-0 flex flex-col rounded-[20px] border border-[#e5e5ea] bg-white p-4 sm:p-5">
                <label>
                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8e8e93]"><LinkIcon className="h-4 w-4"/>URL imagine</span>
                    <input value={selected.url} onChange={event => setExternalUrlLink(event.target.value)} placeholder="Lipește adresa imaginii" className="ios-search !pl-4"/>
                    {error && <p className="mt-2 rounded-xl bg-[#ff3b30]/10 px-3 py-2 text-xs text-[#ff3b30]">{error}</p>}
                </label>
                {selected.url ? (
                    <>
                        <label className="mt-4">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">Etichete</span>
                            <input value={tags} onChange={event => setTags(event.target.value)} placeholder="separate prin virgulă" className="ios-search !pl-4"/>
                        </label>
                        <button type="button" onClick={saveCrop} disabled={loading} className="ios-primary-button mt-auto pt-3 disabled:cursor-wait disabled:opacity-60">{loading ? 'Se salvează…' : 'Salvează imaginea'}</button>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
                        <LinkIcon className="mb-3 h-9 w-9 text-[#c7c7cc]"/>
                        <p className="text-sm font-semibold text-[#1c1c1e]">Lipește linkul imaginii</p>
                        <p className="mt-1 text-xs leading-5 text-[#8e8e93]">Imaginea va putea fi decupată înainte de salvare.</p>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default GoogleTab;
