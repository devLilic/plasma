import GuestLayout from '@/Layouts/GuestLayout';
import {Head, Link, useForm} from '@inertiajs/react';
import {FormEventHandler} from 'react';
import AuthField from '@/Components/Auth/AuthField';

interface ForgotPasswordProps { status?: string }

const ForgotPassword = ({status}: ForgotPasswordProps) => {
    const {data, setData, post, processing, errors} = useForm({email: ''});
    const submit: FormEventHandler = event => { event.preventDefault(); post(route('password.email')); };

    return (
        <GuestLayout>
            <Head title="Recuperare parolă"/>
            <div className="mb-7 text-center">
                <p className="ios-eyebrow">Recuperare acces</p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#172033]">Resetează parola</h1>
                <p className="mt-2 text-sm leading-6 text-[#65728a]">Îți trimitem un link sigur la adresa asociată contului.</p>
            </div>
            {status && <div className="auth-status">{status}</div>}
            <form onSubmit={submit} className="space-y-5">
                <AuthField label="Email" id="email" type="email" name="email" value={data.email} autoFocus onChange={event => setData('email', event.target.value)} error={errors.email}/>
                <button type="submit" disabled={processing} className="ios-primary-button w-full">{processing ? 'Se trimite…' : 'Trimite linkul de resetare'}</button>
                <Link href={route('login')} className="block rounded-lg text-center text-sm font-semibold text-[#286ee7]">Înapoi la autentificare</Link>
            </form>
        </GuestLayout>
    );
};

export default ForgotPassword;
