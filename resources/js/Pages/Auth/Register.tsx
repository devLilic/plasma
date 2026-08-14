import {FormEventHandler, useEffect} from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import {Head, Link, useForm} from '@inertiajs/react';
import AuthField from '@/Components/Auth/AuthField';

interface RegisterFormData { name: string; email: string; password: string; password_confirmation: string }

const Register = () => {
    const {data, setData, post, processing, errors, reset} = useForm<RegisterFormData>({name: '', email: '', password: '', password_confirmation: ''});
    useEffect(() => () => reset('password', 'password_confirmation'), []);
    const submit: FormEventHandler = event => { event.preventDefault(); post(route('register')); };

    return (
        <GuestLayout>
            <Head title="Creează cont"/>
            <div className="mb-7 text-center">
                <p className="ios-eyebrow">Cont nou</p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#172033]">Creează-ți workspace-ul</h1>
                <p className="mt-2 text-sm leading-6 text-[#65728a]">Organizează vizualurile și playlisturile într-un singur loc.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
                <AuthField label="Nume" id="name" name="name" value={data.name} autoComplete="name" autoFocus required onChange={event => setData('name', event.target.value)} error={errors.name}/>
                <AuthField label="Email" id="email" type="email" name="email" value={data.email} required onChange={event => setData('email', event.target.value)} error={errors.email}/>
                <AuthField label="Parolă" id="password" type="password" name="password" value={data.password} autoComplete="new-password" required onChange={event => setData('password', event.target.value)} error={errors.password}/>
                <AuthField label="Confirmă parola" id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} autoComplete="new-password" required onChange={event => setData('password_confirmation', event.target.value)} error={errors.password_confirmation}/>
                <button type="submit" disabled={processing} className="ios-primary-button !mt-6 w-full">{processing ? 'Se creează…' : 'Creează contul'}</button>
                <Link href={route('login')} className="block rounded-lg text-center text-sm font-semibold text-[#286ee7]">Ai deja cont? Autentifică-te</Link>
            </form>
        </GuestLayout>
    );
};

export default Register;
