import React, {useState} from 'react';
import {CheckCircleIcon, PlusIcon, UserGroupIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {useForm} from '@inertiajs/react';

export default function NameGraphicTemplatesSettings({initialTemplates}: {initialTemplates: string[]}) {
    const [newTemplate, setNewTemplate] = useState('');
    const {data, setData, patch, processing, errors, recentlySuccessful} = useForm({templates: initialTemplates});
    const add = () => {
        const value = newTemplate.trim();
        if (value && !data.templates.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) setData('templates', [...data.templates, value]);
        setNewTemplate('');
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        patch(route('profile.mos-name-graphics.update'), {preserveScroll: true});
    };
    return <section className="ios-card overflow-hidden">
        <div className="ios-card-header items-start gap-4">
            <div className="flex min-w-0 gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#007aff]/10 text-[#007aff]"><UserGroupIcon className="h-6 w-6"/></span>
                <div><h2 className="ios-section-title">Burtiere MOS pentru persoane</h2><p className="mt-1 text-sm leading-5 text-[#8e8e93]">Template-urile de aici sunt asociate cu persoana din text și afișează primele 7 cuvinte ale intervenției. Implicit este configurat 02_Nume.</p></div>
            </div>
        </div>
        <form onSubmit={submit} className="space-y-4 border-t border-[#e5e5ea] p-5">
            <div className="flex flex-wrap gap-2" aria-label="Template-uri pentru burtiere de persoane">
                {data.templates.map(template => <span key={template} className="inline-flex items-center gap-1.5 rounded-full bg-[#007aff]/10 py-1.5 pl-3 pr-1.5 text-sm font-semibold text-[#1459a8] ring-1 ring-inset ring-[#007aff]/15">{template}<button type="button" onClick={() => setData('templates', data.templates.filter(item => item !== template))} className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[#007aff]/15" aria-label={`Elimină ${template}`}><XMarkIcon className="h-4 w-4"/></button></span>)}
                {!data.templates.length && <p className="text-sm text-[#8e8e93]">Nu este definit niciun template de burtieră pentru persoane.</p>}
            </div>
            <div><label htmlFor="mos-name-template" className="mb-2 block text-sm font-semibold text-[#1c1c1e]">Adaugă slugul template-ului MOS</label><div className="flex gap-2"><input id="mos-name-template" value={newTemplate} onChange={event => setNewTemplate(event.target.value)} onKeyDown={event => {if (event.key === 'Enter') {event.preventDefault(); add();}}} maxLength={150} placeholder="Exemplu: 02_Nume" className="min-w-0 flex-1 rounded-xl border-0 bg-[#f2f2f7] px-4 py-3 text-sm text-[#1c1c1e] ring-1 ring-inset ring-transparent focus:bg-white focus:ring-[#007aff]"/><button type="button" onClick={add} disabled={!newTemplate.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#f2f2f7] px-4 py-3 text-sm font-semibold text-[#007aff] transition hover:bg-[#e9e9ef] disabled:cursor-not-allowed disabled:opacity-40"><PlusIcon className="h-5 w-5"/>Adaugă</button></div>{errors.templates && <p role="alert" className="mt-2 text-sm text-[#ff3b30]">{errors.templates}</p>}</div>
            <div className="flex items-center justify-between gap-4"><span className="min-h-5 text-sm text-[#248a3d]">{recentlySuccessful && <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/>Setările au fost salvate.</span>}</span><button type="submit" disabled={processing} className="ios-primary-button disabled:cursor-wait disabled:opacity-50">{processing ? 'Se salvează…' : 'Salvează template-urile'}</button></div>
        </form>
    </section>;
}
