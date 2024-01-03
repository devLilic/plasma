import {useRef, FormEventHandler} from 'react';
import {useForm} from '@inertiajs/react';
import {Transition} from '@headlessui/react';
import {Button, Input, Typography} from "@material-tailwind/react";


interface UpdatePasswordFormData {
    current_password: string
    password: string
    password_confirmation: string
}

const UpdatePasswordForm = ({className = ''}: { className?: string }) => {
    const passwordInput = useRef<HTMLInputElement | null>(null);
    const currentPasswordInput = useRef<HTMLInputElement | null>(null);

    const {data, setData, errors, put, reset, processing, recentlySuccessful} = useForm<UpdatePasswordFormData>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Update Password</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Ensure your account is using a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <Input label="Current Password"
                           color={"indigo"}
                           id="current_password"
                           type="password"
                           value={data.current_password}
                           autoComplete="current_password"
                           onChange={(e) => setData('current_password', e.target.value)}
                           inputRef={currentPasswordInput}
                    />
                    <Typography color={"red"} variant={'small'}>{errors.current_password ?? ''}</Typography>
                </div>

                <div>
                    <Input label="New Password"
                           color={"indigo"}
                           id="password"
                           type="password"
                           value={data.password}
                           autoComplete="new-password"
                           onChange={(e) => setData('password', e.target.value)}
                           inputRef={passwordInput}
                    />

                    <Typography color={"red"} variant={'small'}>{errors.password ?? ''}</Typography>
                </div>

                <div>
                    <Input label="Confirm Password"
                           color={"indigo"}
                           id="password_confirmation"
                           type="password"
                           value={data.password_confirmation}
                           autoComplete="new-password"
                           onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    <Typography color={"red"} variant={'small'}>{errors.password_confirmation ?? ''}</Typography>
                </div>

                <div className="flex items-center gap-4">
                    <Button size="sm"
                            color="blue"
                            disabled={processing}
                            type="submit"
                    >Save</Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
export default UpdatePasswordForm;
