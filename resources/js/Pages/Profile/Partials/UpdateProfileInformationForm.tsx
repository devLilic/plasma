import {Link, useForm, usePage} from '@inertiajs/react';
import {Transition} from '@headlessui/react';
import React, {FormEventHandler} from 'react';
import {PageProps} from '@/types';
import {Button, Input, Typography} from "@material-tailwind/react";

interface UpdateProfileInformationProps{
    mustVerifyEmail: boolean,
    status?: string,
    className?: string
}

const UpdateProfileInformation = ({mustVerifyEmail, status, className}: UpdateProfileInformationProps) => {
    const user = usePage<PageProps>().props.auth.user;

    const {data, setData, patch, errors, processing, recentlySuccessful} = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <Input label="Name"
                           color={"indigo"}
                           id="name"
                           name="name"
                           value={data.name}
                           autoComplete="name"
                           error={!!errors.name}
                           onChange={(e) => setData('name', e.target.value)}
                    />
                    <Typography color={"red"} variant={'small'}>{errors.name ?? ''}</Typography>
                </div>

                <div>
                    <Input label="Email"
                           color={"indigo"}
                           id="email"
                           type="email"
                           name="email"
                           value={data.email}
                           error={!!errors.email}
                           autoComplete="username"
                           onChange={(e) => setData('email', e.target.value)}
                    />
                    <Typography color={"red"} variant={'small'}>{errors.email ?? ''}</Typography>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-sm mt-2 text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-medium text-sm text-green-600">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

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

export default UpdateProfileInformation;
