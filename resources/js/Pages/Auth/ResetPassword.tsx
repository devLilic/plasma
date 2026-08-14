import {FormEventHandler, useEffect} from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import {Head, useForm} from '@inertiajs/react';
import AuthField from '@/Components/Auth/AuthField';

interface ResetPasswordProps { token: string; email: string }
interface ResetPasswordForm extends ResetPasswordProps { password: string; password_confirmation: string }

export default function ResetPassword({token, email}: ResetPasswordProps) {
    const {data, setData, post, processing, errors, reset} = useForm<ResetPasswordForm>({token, email, password: '', password_confirmation: ''});
    useEffect(() => () => reset('password', 'password_confirmation'), []);
    const submit: FormEventHandler = event => { event.preventDefault(); post(route('password.store')); };

    return (
        <GuestLayout>
            <Head title="Parolă nouă"/>
            <div className="mb-7 text-center">
                <p className="ios-eyebrow">Securitate</p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#172033]">Alege o parolă nouă</h1>
                <p className="mt-2 text-sm leading-6 text-[#65728a]">Folosește o parolă sigură pe care nu o utilizezi în altă parte.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
                <AuthField label="Email" id="email" type="email" name="email" value={data.email} autoComplete="username" onChange={event => setData('email', event.target.value)} error={errors.email}/>
                <AuthField label="Parolă nouă" id="password" type="password" name="password" value={data.password} autoComplete="new-password" autoFocus onChange={event => setData('password', event.target.value)} error={errors.password}/>
                <AuthField label="Confirmă parola" id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} autoComplete="new-password" required onChange={event => setData('password_confirmation', event.target.value)} error={errors.password_confirmation}/>
                <button type="submit" disabled={processing} className="ios-primary-button !mt-6 w-full">{processing ? 'Se actualizează…' : 'Salvează parola'}</button>
            </form>
        </GuestLayout>
    );
}
