import InputError from '@/Components/InputError';
import {TrashIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {FormEventHandler, useRef, useState} from 'react';
import {useForm} from '@inertiajs/react';

export default function DeleteUserForm({className = ''}: {className?: string}) {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    const {data, setData, delete: destroy, processing, reset, errors} = useForm({password: ''});

    const close = () => { setOpen(false); reset(); };
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        destroy(route('profile.destroy'), {preserveScroll: true, onSuccess: close, onError: () => passwordInput.current?.focus(), onFinish: () => reset()});
    };

    return (
        <section className={className}>
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff3b30]/10 text-[#ff3b30]"><TrashIcon className="h-5 w-5"/></span>
                <div><h2 className="ios-section-title">Ștergerea contului</h2><p className="mt-1 text-sm leading-6 text-[#6e6e73]">Contul și toate datele asociate vor fi șterse definitiv. Această acțiune nu poate fi anulată.</p></div>
            </div>
            <button type="button" className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-[#ff3b30]/10 px-4 text-sm font-semibold text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white" onClick={() => setOpen(true)}>Șterge contul</button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
                    <form onSubmit={submit} className="ios-card w-full max-w-md overflow-hidden bg-white">
                        <div className="ios-card-header">
                            <h3 id="delete-account-title" className="ios-section-title">Confirmă ștergerea</h3>
                            <button type="button" aria-label="Închide" className="ios-secondary-button !min-h-9 !w-9 !p-0" onClick={close}><XMarkIcon className="h-5 w-5"/></button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm leading-6 text-[#6e6e73]">Introdu parola pentru a confirma ștergerea definitivă a contului.</p>
                            <input ref={passwordInput} className="ios-search mt-5 !pl-4" type="password" autoFocus value={data.password} placeholder="Parola" onChange={(e) => setData('password', e.target.value)}/>
                            <div className="mt-2"><InputError message={errors.password}/></div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-[#e5e5ea] p-4">
                            <button type="button" className="ios-secondary-button" onClick={close}>Renunță</button>
                            <button type="submit" disabled={processing} className="inline-flex min-h-10 items-center rounded-xl bg-[#ff3b30] px-4 text-sm font-semibold text-white disabled:opacity-50">Șterge definitiv</button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}
