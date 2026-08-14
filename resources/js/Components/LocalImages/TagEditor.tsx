import React, {KeyboardEvent, useEffect, useMemo, useRef, useState} from 'react';
import {PlusIcon, TagIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {tagsApi} from '@/API/tags.api';
import {Tag} from '@/types';

interface Props {
    initialTags: Tag[];
    onChange: (tags: string[]) => void;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase('ro').slice(0, 80);

export default function TagEditor({initialTags, onChange}: Props) {
    const [tags, setTags] = useState<string[]>([]);
    const [fragment, setFragment] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTags(initialTags.map(tag => tag.title));
        setFragment('');
        setSuggestions([]);
    }, [initialTags]);

    useEffect(() => onChange(tags), [tags]);

    useEffect(() => {
        const query = normalize(fragment);
        if (!query) {
            setSuggestions([]);
            return;
        }
        const timer = window.setTimeout(async () => {
            try {
                setSuggestions(await tagsApi.suggestions(query));
            } catch {
                setSuggestions([]);
            }
        }, 180);
        return () => window.clearTimeout(timer);
    }, [fragment]);

    const selected = useMemo(() => new Set(tags.map(normalize)), [tags]);
    const visibleSuggestions = suggestions.filter(tag => !selected.has(normalize(tag.title)));

    const add = (value: string) => {
        const title = normalize(value);
        if (title && !selected.has(title)) setTags(current => [...current, title]);
        setFragment('');
        inputRef.current?.focus();
    };

    const handleChange = (value: string) => {
        if (!value.includes(',')) {
            setFragment(value);
            return;
        }
        const parts = value.split(',');
        const completed = parts.slice(0, -1).map(normalize).filter(Boolean);
        if (completed.length) setTags(current => Array.from(new Set([...current.map(normalize), ...completed])));
        setFragment(parts.at(-1) ?? '');
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            add(fragment);
        } else if (event.key === 'Backspace' && !fragment && tags.length) {
            setTags(current => current.slice(0, -1));
        }
    };

    return (
        <div>
            <div className="relative">
                <div className="saved-tag-editor flex min-h-[58px] flex-wrap items-center gap-2 rounded-[18px] p-2.5 ring-[#2878ff]/20 transition focus-within:bg-white/90 focus-within:ring-4" onClick={() => inputRef.current?.focus()}>
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#78a9f3]/20 bg-gradient-to-br from-[#e3f2ff] to-[#e9e8ff] py-1.5 pl-3 pr-1.5 text-sm font-semibold text-[#24589f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                            <span className="truncate">{tag}</span>
                            <button type="button" aria-label={`Elimină eticheta ${tag}`} className="flex h-6 w-6 items-center justify-center rounded-full text-[#4472ad] transition hover:bg-white/70 hover:text-[#173f77]" onClick={(event) => {event.stopPropagation(); setTags(current => current.filter(item => item !== tag));}}><XMarkIcon className="h-3.5 w-3.5"/></button>
                        </span>
                    ))}
                    <input ref={inputRef} value={fragment} onChange={event => handleChange(event.target.value)} onKeyDown={handleKeyDown} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 150)} placeholder={tags.length ? 'Adaugă o etichetă…' : 'Scrie prima etichetă…'} className="h-8 min-w-[190px] flex-1 border-0 bg-transparent px-1 text-sm font-medium text-[#14213d] outline-none ring-0 placeholder:text-[#687b96] focus:ring-0"/>
                </div>
                {focused && fragment.trim() && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[18px] border border-white/90 bg-[#f5faff]/95 p-1.5 shadow-[0_18px_45px_rgba(31,59,105,0.18)] backdrop-blur-2xl">
                        {visibleSuggestions.length > 0 ? visibleSuggestions.map(tag => (
                            <button type="button" key={tag.id} onMouseDown={event => event.preventDefault()} onClick={() => add(tag.title)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#14213d] hover:bg-[#e7f1ff]">
                                <TagIcon className="h-4 w-4 text-[#2878ff]"/><span className="flex-1">{tag.title}</span><PlusIcon className="h-4 w-4 text-[#607796]"/>
                            </button>
                        )) : (
                            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => add(fragment)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#2267d9] hover:bg-[#e7f1ff]">
                                <PlusIcon className="h-4 w-4"/>Creează „{normalize(fragment)}”
                            </button>
                        )}
                    </div>
                )}
            </div>
            <p className="mt-2.5 text-xs font-medium leading-5 text-[#536983]">Apasă Enter sau virgulă pentru a adăuga. Backspace elimină ultima etichetă.</p>
        </div>
    );
}
