import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import {LockClosedIcon} from '@heroicons/react/24/outline';
import {Head, useForm} from '@inertiajs/react';
import {FormEventHandler, useEffect} from 'react';

export default function ConfirmPassword() {
    const {data, setData, post, processing, errors, reset} = useForm({password: ''});
    useEffect(() => () => reset('password'), []);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('password.confirm'));
    };

    return (
        <GuestLayout>
            <Head title="Confirmă parola"/>
            <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#007aff]/10 text-[#007aff]"><LockClosedIcon className="h-5 w-5"/></span>
                <div><h1 className="text-xl font-bold tracking-[-0.03em] text-[#1c1c1e]">Confirmă parola</h1><p className="mt-1 text-sm leading-5 text-[#6e6e73]">Aceasta este o zonă protejată. Confirmă parola înainte de a continua.</p></div>
            </div>
            <form onSubmit={submit}>
                <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#6e6e73]">Parolă</span>
                    <input className="ios-search !pl-4" id="password" type="password" value={data.password} autoComplete="current-password" autoFocus onChange={(e) => setData('password', e.target.value)}/>
                    <div className="mt-2"><InputError message={errors.password}/></div>
                </label>
                <button className="ios-primary-button mt-6 w-full" disabled={processing} type="submit">Continuă</button>
            </form>
        </GuestLayout>
    );
}
