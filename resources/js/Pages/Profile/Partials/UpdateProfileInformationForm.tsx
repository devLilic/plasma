import InputError from '@/Components/InputError';
import {EnvelopeIcon, UserIcon} from '@heroicons/react/24/outline';
import {Link, useForm, usePage} from '@inertiajs/react';
import {Transition} from '@headlessui/react';
import {FormEventHandler} from 'react';
import {PageProps} from '@/types';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}

export default function UpdateProfileInformation({mustVerifyEmail, status, className = ''}: Props) {
    const user = usePage<PageProps>().props.auth.user;
    const {data, setData, patch, errors, processing, recentlySuccessful} = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        patch(route('profile.update'), {preserveScroll: true});
    };

    return (
        <section className={className}>
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007aff]/10 text-[#007aff]">
                    <UserIcon className="h-5 w-5"/>
                </span>
                <div>
                    <h2 className="ios-section-title">Date personale</h2>
                    <p className="mt-1 text-sm text-[#6e6e73]">Actualizează numele și adresa de e-mail folosite în aplicație.</p>
                </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
                <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#6e6e73]">Nume</span>
                    <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#8e8e93]"/>
                        <input className="ios-search" id="name" value={data.name} autoComplete="name" onChange={(e) => setData('name', e.target.value)}/>
                    </div>
                    <div className="mt-2"><InputError message={errors.name}/></div>
                </label>

                <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#6e6e73]">E-mail</span>
                    <div className="relative">
                        <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#8e8e93]"/>
                        <input className="ios-search" id="email" type="email" value={data.email} autoComplete="username" onChange={(e) => setData('email', e.target.value)}/>
                    </div>
                    <div className="mt-2"><InputError message={errors.email}/></div>
                </label>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-xl bg-[#ff9500]/10 p-4 text-sm text-[#7a4a00]">
                        Adresa nu este verificată.{' '}
                        <Link href={route('verification.send')} method="post" as="button" className="font-semibold underline">
                            Retrimite e-mailul de verificare
                        </Link>
                        {status === 'verification-link-sent' && <p className="mt-2 font-medium text-[#248a3d]">Linkul de verificare a fost trimis.</p>}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button className="ios-primary-button" disabled={processing} type="submit">Salvează profilul</button>
                    <Transition show={recentlySuccessful} enter="transition" enterFrom="opacity-0" leave="transition" leaveTo="opacity-0">
                        <p className="text-sm font-medium text-[#248a3d]">Modificări salvate</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
