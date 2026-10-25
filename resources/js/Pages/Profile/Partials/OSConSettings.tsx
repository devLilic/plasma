import {useForm} from '@inertiajs/react';
import type {FormEvent} from 'react';

export interface OSConSettingsData {endpoint: string; hasToken: boolean; error: string | null}

export default function OSConSettings({settings}: {settings: OSConSettingsData}) {
    const {data, setData, patch, processing, errors, recentlySuccessful} = useForm({endpoint: settings.endpoint, token: '', clearToken: false});
    const submit = (event: FormEvent) => {
        event.preventDefault();
        patch(route('profile.oscon.update'), {preserveScroll: true, onSuccess: () => setData('token', '')});
    };
    return <section id="oscon" className="ios-card scroll-mt-24 p-5 sm:p-8">
        <h2 className="ios-section-title">Conexiune OSCon</h2>
        <p className="mt-2 text-sm text-[#65728a]">Configurează serviciul de pe stația LiveBoard. Conectarea se face explicit din playlist.</p>
        {settings.error && <p role="alert" className="mt-3 text-sm text-red-700">{settings.error}</p>}
        <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block text-sm font-semibold">Adresa OSCon
                <input type="url" required value={data.endpoint} onChange={e => setData('endpoint', e.target.value)} className="mt-1 w-full rounded-xl border-gray-200" placeholder="http://127.0.0.1:47834"/>
            </label>
            {errors.endpoint && <p role="alert" className="text-sm text-red-700">{errors.endpoint}</p>}
            <label className="block text-sm font-semibold">Token OSCon
                <input type="password" autoComplete="new-password" value={data.token} onChange={e => setData('token', e.target.value)} className="mt-1 w-full rounded-xl border-gray-200" placeholder={settings.hasToken ? 'Token salvat — lasă gol pentru a-l păstra' : 'Copiază tokenul din Settings OSCon'}/>
            </label>
            {errors.token && <p role="alert" className="text-sm text-red-700">{errors.token}</p>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.clearToken} onChange={e => setData('clearToken', e.target.checked)}/>Șterge tokenul salvat</label>
            <div className="flex items-center justify-between gap-3">
                <span role="status" className="text-sm text-green-700">{recentlySuccessful ? 'Conexiunea a fost salvată.' : settings.hasToken ? 'Token configurat' : 'Token neconfigurat'}</span>
                <button type="submit" disabled={processing} className="ios-primary-button disabled:opacity-50">Salvează conexiunea</button>
            </div>
        </form>
    </section>;
}
