import GuestLayout from '@/Layouts/GuestLayout';
import {Head, Link, useForm} from '@inertiajs/react';
import {FormEventHandler} from 'react';
import {EnvelopeIcon} from '@heroicons/react/24/outline';

interface VerifyEmailProps { status?: string }

const VerifyEmail = ({status}: VerifyEmailProps) => {
    const {post, processing} = useForm({});
    const submit: FormEventHandler = event => { event.preventDefault(); post(route('verification.send')); };

    return (
        <GuestLayout>
            <Head title="Verificare email"/>
            <div className="text-center">
                <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/75 bg-white/45 text-[#286ee7] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(56,88,155,0.1)]"><EnvelopeIcon className="h-7 w-7"/></span>
                <p className="ios-eyebrow">Ultimul pas</p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#172033]">Verifică adresa de email</h1>
                <p className="mt-2 text-sm leading-6 text-[#65728a]">Deschide linkul trimis pe email pentru a activa workspace-ul. Dacă mesajul nu a ajuns, putem trimite altul.</p>
            </div>
            {status === 'verification-link-sent' && <div className="auth-status mt-5">Un nou link de verificare a fost trimis.</div>}
            <form onSubmit={submit} className="mt-6 space-y-3">
                <button type="submit" disabled={processing} className="ios-primary-button w-full">{processing ? 'Se trimite…' : 'Retrimite emailul'}</button>
                <Link href={route('logout')} method="post" as="button" className="ios-secondary-button w-full">Deconectare</Link>
            </form>
        </GuestLayout>
    );
};

export default VerifyEmail;
