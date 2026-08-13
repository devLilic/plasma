import InputError from '@/Components/InputError';
import {KeyIcon} from '@heroicons/react/24/outline';
import {Transition} from '@headlessui/react';
import {FormEventHandler, useRef} from 'react';
import {useForm} from '@inertiajs/react';

interface FormData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export default function UpdatePasswordForm({className = ''}: {className?: string}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const {data, setData, errors, put, reset, processing, recentlySuccessful} = useForm<FormData>({
        current_password: '', password: '', password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const fields = [
        {id: 'current_password' as const, label: 'Parola actuală', autoComplete: 'current-password', ref: currentPasswordInput},
        {id: 'password' as const, label: 'Parola nouă', autoComplete: 'new-password', ref: passwordInput},
        {id: 'password_confirmation' as const, label: 'Confirmă parola nouă', autoComplete: 'new-password', ref: undefined},
    ];

    return (
        <section className={className}>
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5856d6]/10 text-[#5856d6]"><KeyIcon className="h-5 w-5"/></span>
                <div><h2 className="ios-section-title">Securitate</h2><p className="mt-1 text-sm text-[#6e6e73]">Folosește o parolă lungă și unică pentru acest cont.</p></div>
            </div>
            <form onSubmit={submit} className="mt-6 space-y-5">
                {fields.map((field) => (
                    <label className="block" key={field.id}>
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#6e6e73]">{field.label}</span>
                        <input ref={field.ref} className="ios-search !pl-4" id={field.id} type="password" value={data[field.id]} autoComplete={field.autoComplete} onChange={(e) => setData(field.id, e.target.value)}/>
                        <div className="mt-2"><InputError message={errors[field.id]}/></div>
                    </label>
                ))}
                <div className="flex items-center gap-4">
                    <button className="ios-primary-button" disabled={processing} type="submit">Schimbă parola</button>
                    <Transition show={recentlySuccessful} enter="transition" enterFrom="opacity-0" leave="transition" leaveTo="opacity-0"><p className="text-sm font-medium text-[#248a3d]">Parolă actualizată</p></Transition>
                </div>
            </form>
        </section>
    );
}
