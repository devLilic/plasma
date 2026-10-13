import React from 'react';
import {CheckCircleIcon, PhotoIcon} from '@heroicons/react/24/outline';
import {useForm} from '@inertiajs/react';

interface Props {
    initialDimensions: {width: number; height: number};
}

export default function ImageQualitySettings({initialDimensions}: Props) {
    const {data, setData, patch, processing, errors, recentlySuccessful} = useForm(initialDimensions);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        patch(route('profile.image-quality.update'), {preserveScroll: true});
    };

    return (
        <section className="ios-card overflow-hidden">
            <div className="ios-card-header items-start gap-4">
                <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#007aff]/10 text-[#007aff]">
                        <PhotoIcon className="h-6 w-6"/>
                    </span>
                    <div>
                        <h2 className="ios-section-title">Calitatea minimă a imaginilor</h2>
                        <p className="mt-1 text-sm leading-5 text-[#8e8e93]">Imaginea sursă trebuie să atingă aceste dimensiuni. Zona decupată respectă proporțiile 16:9.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4 border-t border-[#e5e5ea] p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="image-minimum-width" className="mb-2 block text-sm font-semibold text-[#1c1c1e]">Lățime minimă (px)</label>
                        <input id="image-minimum-width" type="number" min={1} max={10000} step={1} value={data.width}
                            onChange={event => setData('width', Number(event.target.value))}
                            className="w-full rounded-xl border-0 bg-[#f2f2f7] px-4 py-3 text-sm text-[#1c1c1e] ring-1 ring-inset ring-transparent focus:bg-white focus:ring-[#007aff]"/>
                        {errors.width && <p role="alert" className="mt-2 text-sm text-[#ff3b30]">{errors.width}</p>}
                    </div>
                    <div>
                        <label htmlFor="image-minimum-height" className="mb-2 block text-sm font-semibold text-[#1c1c1e]">Înălțime minimă (px)</label>
                        <input id="image-minimum-height" type="number" min={1} max={10000} step={1} value={data.height}
                            onChange={event => setData('height', Number(event.target.value))}
                            className="w-full rounded-xl border-0 bg-[#f2f2f7] px-4 py-3 text-sm text-[#1c1c1e] ring-1 ring-inset ring-transparent focus:bg-white focus:ring-[#007aff]"/>
                        {errors.height && <p role="alert" className="mt-2 text-sm text-[#ff3b30]">{errors.height}</p>}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="min-h-5 text-sm text-[#248a3d]">
                        {recentlySuccessful && <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/>Pragul a fost salvat.</span>}
                    </span>
                    <button type="submit" disabled={processing} className="ios-primary-button disabled:cursor-wait disabled:opacity-50">
                        {processing ? 'Se salvează…' : 'Salvează pragul'}
                    </button>
                </div>
            </form>
        </section>
    );
}
