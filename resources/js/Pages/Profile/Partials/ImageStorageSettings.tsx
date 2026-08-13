import React from 'react';
import {CheckCircleIcon, FolderIcon} from '@heroicons/react/24/outline';
import {useForm} from '@inertiajs/react';

interface Props {
    initialPath: string;
}

export default function ImageStorageSettings({initialPath}: Props) {
    const {data, setData, patch, processing, errors, recentlySuccessful} = useForm({
        path: initialPath,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        patch(route('profile.image-storage.update'), {preserveScroll: true});
    };

    return (
        <section className="ios-card overflow-hidden">
            <div className="ios-card-header items-start gap-4">
                <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#007aff]/10 text-[#007aff]">
                        <FolderIcon className="h-6 w-6"/>
                    </span>
                    <div>
                        <h2 className="ios-section-title">Locația bibliotecii media</h2>
                        <p className="mt-1 text-sm leading-5 text-[#8e8e93]">Alege folderul de pe calculatorul server în care vor fi salvate imaginile.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4 border-t border-[#e5e5ea] p-5">
                <div>
                    <label htmlFor="image-storage-path" className="mb-2 block text-sm font-semibold text-[#1c1c1e]">Calea absolută a folderului</label>
                    <input
                        id="image-storage-path"
                        type="text"
                        value={data.path}
                        onChange={event => setData('path', event.target.value)}
                        placeholder="D:\\Telejurnal\\_plasma\\_images"
                        spellCheck={false}
                        className="w-full rounded-xl border-0 bg-[#f2f2f7] px-4 py-3 text-sm text-[#1c1c1e] ring-1 ring-inset ring-transparent focus:bg-white focus:ring-[#007aff]"
                    />
                    {errors.path && <p className="mt-2 text-sm text-[#ff3b30]">{errors.path}</p>}
                    <p className="mt-2 text-xs leading-5 text-[#8e8e93]">Folderul trebuie să existe și să permită aplicației citirea, scrierea și ștergerea fișierelor. Imaginile existente nu sunt mutate automat.</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <span className="min-h-5 text-sm text-[#248a3d]">
                        {recentlySuccessful && <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/>Locația a fost salvată.</span>}
                    </span>
                    <button type="submit" disabled={processing || !data.path.trim()} className="ios-primary-button disabled:cursor-wait disabled:opacity-50">
                        {processing ? 'Se verifică…' : 'Salvează locația'}
                    </button>
                </div>
            </form>
        </section>
    );
}
