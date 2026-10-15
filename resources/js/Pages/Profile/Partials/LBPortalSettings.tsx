import {useForm} from '@inertiajs/react';
import type {FormEvent} from 'react';
import {useState} from 'react';

export interface LBPortalSettingsData {host: string; port: number; hasAccessKey: boolean; error: string | null}

export default function LBPortalSettings({settings}: {settings: LBPortalSettingsData}) {
    const {data, setData, patch, processing, errors, recentlySuccessful} = useForm({host: settings.host, port: settings.port, accessKey: '', clearAccessKey: false});
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ok: boolean; message: string} | null>(null);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        patch(route('profile.lb-portal.update'), {preserveScroll: true, onSuccess: () => { setData('accessKey', ''); setTestResult(null); }});
    };
    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const connectionResponse = await fetch(route('lb-portal.connection'), {headers: {Accept: 'application/json'}, credentials: 'same-origin', cache: 'no-store'});
            if (!connectionResponse.ok) throw new Error('Salvează mai întâi o cheie de acces validă.');
            const connection = await connectionResponse.json() as {accessKey: string};
            const endpoint = `http://${data.host}:${data.port}`;
            const accessKey = data.accessKey || connection.accessKey;
            const requestId = crypto.randomUUID();
            const response = await fetch(`${endpoint}/v1/requests`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessKey}`},
                body: JSON.stringify({requestId, sentAt: new Date().toISOString(), source: 'plasma.test', type: 'connection-test', template: '__connection_test__', params: {message: 'Test conexiune Plasma → LB-Portal'}}),
                cache: 'no-store',
            });
            const result = await response.json().catch(() => ({})) as {requestId?: string; error?: string};
            if (!response.ok || result.requestId !== requestId) throw new Error(result.error || `LB-Portal a răspuns cu HTTP ${response.status}.`);
            setTestResult({ok: true, message: 'Cererea de test a fost primită de LB-Portal și apare în consola aplicației.'});
        } catch (error) {
            setTestResult({ok: false, message: error instanceof Error ? error.message : 'Conectarea la LB-Portal a eșuat.'});
        } finally {
            setTesting(false);
        }
    };

    return <section id="lb-portal" className="ios-card scroll-mt-24 p-5 sm:p-8">
        <h2 className="ios-section-title">Conexiune LB-Portal</h2>
        <p className="mt-2 text-sm text-[#65728a]">Indică adresa aplicației LB-Portal din rețeaua locală. Testul trimite o cerere JSON de diagnostic, fără să execute template-uri sau să contacteze LiveBoard.</p>
        {settings.error && <p role="alert" className="mt-3 text-sm text-red-700">{settings.error}</p>}
        <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                <label className="block text-sm font-semibold">IP LB-Portal
                    <input type="text" required inputMode="decimal" value={data.host} onChange={e => setData('host', e.target.value)} className="mt-1 w-full rounded-xl border-gray-200" placeholder="192.168.1.20"/>
                </label>
                <label className="block text-sm font-semibold">Port
                    <input type="number" min={1} max={65535} required value={data.port} onChange={e => setData('port', Number(e.target.value))} className="mt-1 w-full rounded-xl border-gray-200" placeholder="47835"/>
                </label>
            </div>
            {errors.host && <p role="alert" className="text-sm text-red-700">{errors.host}</p>}
            {errors.port && <p role="alert" className="text-sm text-red-700">{errors.port}</p>}
            <label className="block text-sm font-semibold">Cheie de acces LB-Portal
                <input type="password" autoComplete="new-password" value={data.accessKey} onChange={e => setData('accessKey', e.target.value)} className="mt-1 w-full rounded-xl border-gray-200" placeholder={settings.hasAccessKey ? 'Cheie salvată — lasă gol pentru a o păstra' : 'Copiază cheia din consola LB-Portal'}/>
            </label>
            {errors.accessKey && <p role="alert" className="text-sm text-red-700">{errors.accessKey}</p>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.clearAccessKey} onChange={e => setData('clearAccessKey', e.target.checked)}/>Șterge cheia salvată</label>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span role="status" className={`text-sm ${testResult?.ok ? 'text-green-700' : testResult ? 'text-red-700' : 'text-[#65728a]'}`}>{testResult?.message || (recentlySuccessful ? 'Conexiunea a fost salvată.' : settings.hasAccessKey ? 'Cheie configurată' : 'Cheie neconfigurată')}</span>
                <div className="flex gap-2">
                    <button type="button" onClick={() => void testConnection()} disabled={processing || testing || (!settings.hasAccessKey && !data.accessKey) || data.clearAccessKey} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">{testing ? 'Se testează…' : 'Testează conexiunea'}</button>
                    <button type="submit" disabled={processing} className="ios-primary-button disabled:opacity-50">Salvează</button>
                </div>
            </div>
        </form>
    </section>;
}
