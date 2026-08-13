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
                <div className="flex min-h-[54px] flex-wrap items-center gap-2 rounded-2xl bg-[#f2f2f7] p-2.5 ring-[#007aff]/25 transition focus-within:bg-white focus-within:ring-2" onClick={() => inputRef.current?.focus()}>
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#007aff]/10 py-1.5 pl-3 pr-1.5 text-sm font-medium text-[#0066d6]">
                            <span className="truncate">{tag}</span>
                            <button type="button" aria-label={`Elimină eticheta ${tag}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#007aff]/15" onClick={(event) => {event.stopPropagation(); setTags(current => current.filter(item => item !== tag));}}><XMarkIcon className="h-3.5 w-3.5"/></button>
                        </span>
                    ))}
                    <input ref={inputRef} value={fragment} onChange={event => handleChange(event.target.value)} onKeyDown={handleKeyDown} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 150)} placeholder={tags.length ? 'Adaugă etichetă…' : 'Scrie o etichetă și apasă virgulă'} className="h-8 min-w-[190px] flex-1 border-0 bg-transparent px-1 text-sm text-[#1c1c1e] outline-none ring-0 placeholder:text-[#8e8e93] focus:ring-0"/>
                </div>
                {focused && fragment.trim() && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white p-1.5 shadow-[0_14px_35px_rgba(0,0,0,0.14)]">
                        {visibleSuggestions.length > 0 ? visibleSuggestions.map(tag => (
                            <button type="button" key={tag.id} onMouseDown={event => event.preventDefault()} onClick={() => add(tag.title)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[#1c1c1e] hover:bg-[#f2f2f7]">
                                <TagIcon className="h-4 w-4 text-[#007aff]"/><span className="flex-1">{tag.title}</span><PlusIcon className="h-4 w-4 text-[#8e8e93]"/>
                            </button>
                        )) : (
                            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => add(fragment)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[#007aff] hover:bg-[#007aff]/5">
                                <PlusIcon className="h-4 w-4"/>Creează „{normalize(fragment)}”
                            </button>
                        )}
                    </div>
                )}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#8e8e93]">Virgula sau Enter finalizează eticheta. Backspace elimină ultima etichetă.</p>
        </div>
    );
}
