import React, {useState} from 'react';
import {CheckCircleIcon, FunnelIcon, PlusIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {useForm} from '@inertiajs/react';

interface Props {
    initialTerms: string[];
}

export default function PlaylistTitleExclusionsSettings({initialTerms}: Props) {
    const [newTerm, setNewTerm] = useState('');
    const {data, setData, patch, processing, errors, recentlySuccessful} = useForm({
        terms: initialTerms,
    });

    const addTerm = () => {
        const normalized = newTerm.trim().toLocaleUpperCase('ro-RO');

        if (normalized && !data.terms.includes(normalized)) {
            setData('terms', [...data.terms, normalized]);
        }

        setNewTerm('');
    };

    const removeTerm = (term: string) => {
        setData('terms', data.terms.filter(item => item !== term));
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        patch(route('profile.playlist-title-exclusions.update'), {preserveScroll: true});
    };

    return (
        <section className="ios-card overflow-hidden">
            <div className="ios-card-header items-start gap-4">
                <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff9500]/10 text-[#ff9500]">
                        <FunnelIcon className="h-6 w-6"/>
                    </span>
                    <div>
                        <h2 className="ios-section-title">Titluri excluse la import</h2>
                        <p className="mt-1 text-sm leading-5 text-[#8e8e93]">
                            Articolele ale căror titluri tehnice conțin unul dintre acești termeni nu vor fi incluse în playlist.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4 border-t border-[#e5e5ea] p-5">
                <div>
                    <div className="flex flex-wrap gap-2" aria-label="Termeni excluși">
                        {data.terms.map(term => (
                            <span key={term} className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9500]/10 py-1.5 pl-3 pr-1.5 text-sm font-semibold text-[#9a5b00] ring-1 ring-inset ring-[#ff9500]/15">
                                {term}
                                <button
                                    type="button"
                                    onClick={() => removeTerm(term)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-[#9a5b00] transition hover:bg-[#ff9500]/15"
                                    aria-label={`Elimină ${term}`}
                                >
                                    <XMarkIcon className="h-4 w-4"/>
                                </button>
                            </span>
                        ))}
                        {data.terms.length === 0 && (
                            <p className="text-sm text-[#8e8e93]">Lista este goală. La import nu va fi exclus niciun titlu.</p>
                        )}
                    </div>

                    <label htmlFor="playlist-title-exclusion" className="mt-4 mb-2 block text-sm font-semibold text-[#1c1c1e]">
                        Adaugă un termen sau o expresie
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="playlist-title-exclusion"
                            type="text"
                            value={newTerm}
                            onChange={event => setNewTerm(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addTerm();
                                }
                            }}
                            maxLength={100}
                            placeholder="Exemplu: SPORT"
                            className="min-w-0 flex-1 rounded-xl border-0 bg-[#f2f2f7] px-4 py-3 text-sm text-[#1c1c1e] ring-1 ring-inset ring-transparent focus:bg-white focus:ring-[#007aff]"
                        />
                        <button
                            type="button"
                            onClick={addTerm}
                            disabled={!newTerm.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#f2f2f7] px-4 py-3 text-sm font-semibold text-[#007aff] transition hover:bg-[#e9e9ef] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <PlusIcon className="h-5 w-5"/>
                            Adaugă
                        </button>
                    </div>
                    {errors.terms && <p className="mt-2 text-sm text-[#ff3b30]">{errors.terms}</p>}
                    <p className="mt-2 text-xs leading-5 text-[#8e8e93]">
                        Modificările se aplică numai playlisturilor încărcate după salvare. Playlisturile existente nu sunt modificate.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <span className="min-h-5 text-sm text-[#248a3d]">
                        {recentlySuccessful && (
                            <span className="flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5"/>
                                Lista a fost salvată.
                            </span>
                        )}
                    </span>
                    <button type="submit" disabled={processing} className="ios-primary-button disabled:cursor-wait disabled:opacity-50">
                        {processing ? 'Se salvează…' : 'Salvează lista'}
                    </button>
                </div>
            </form>
        </section>
    );
}
