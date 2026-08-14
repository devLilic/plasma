import {FormEventHandler, useEffect} from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import {Head, Link, useForm} from '@inertiajs/react';
import AuthField from '@/Components/Auth/AuthField';

interface LoginProps {
    status?: string
    canResetPassword: boolean
}

interface FormData {
    email: string
    password: string
    remember: boolean
}

const Login = ({status, canResetPassword}: LoginProps) => {
    const {data, setData, post, processing, errors, reset} = useForm<FormData>({email: '', password: '', remember: false});

    useEffect(() => () => reset('password'), []);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Autentificare"/>
            <div className="mb-7 text-center">
                <p className="ios-eyebrow">Bine ai revenit</p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#172033]">Intră în workspace</h1>
                <p className="mt-2 text-sm leading-6 text-[#65728a]">Continuă cu biblioteca și playlisturile tale.</p>
            </div>

            {status && <div className="auth-status">{status}</div>}

            <form onSubmit={submit} className="space-y-4">
                <AuthField label="Email" id="email" type="email" name="email" value={data.email} autoComplete="username" autoFocus onChange={event => setData('email', event.target.value)} error={errors.email}/>
                <AuthField label="Parolă" id="password" type="password" name="password" value={data.password} autoComplete="current-password" onChange={event => setData('password', event.target.value)} error={errors.password}/>

                <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#65728a]">
                        <input type="checkbox" checked={data.remember} onChange={event => setData('remember', event.target.checked)} className="rounded border-white/80 bg-white/60 text-[#2878ff] shadow-sm focus:ring-[#2878ff]/20"/>
                        Păstrează sesiunea
                    </label>
                    {canResetPassword && <Link href={route('password.request')} className="rounded-lg text-sm font-semibold text-[#286ee7] hover:text-[#1e5cc7]">Ai uitat parola?</Link>}
                </div>

                <button type="submit" disabled={processing} className="ios-primary-button !mt-6 w-full">{processing ? 'Se conectează…' : 'Autentificare'}</button>
            </form>
        </GuestLayout>
    );
};

export default Login;
