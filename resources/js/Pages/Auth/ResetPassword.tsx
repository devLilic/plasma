import {useEffect, FormEventHandler} from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import {Head, useForm} from '@inertiajs/react';
import {Button, Input, Typography} from "@material-tailwind/react";
import InputError from "@/Components/InputError";

interface ResetPasswordProps {
    token: string,
    email: string
}

interface ResetPasswordForm extends ResetPasswordProps{
    password: string,
    password_confirmation: string,
}

export default function ResetPassword({token, email}: ResetPasswordProps) {
    const {data, setData, post, processing, errors, reset} = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'));
    };

    return (
        <GuestLayout>
            <Head title="Reset Password"/>

            <form onSubmit={submit}>
                <div>
                    <Input label="Email"
                           crossOrigin={null}
                           color={"indigo"}
                           id="email"
                           type="email"
                           name="email"
                           value={data.email}
                           autoComplete="username"
                           onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="mt-4">
                    <Input label="Password"
                           crossOrigin={null}
                           color={"indigo"}
                           id="password"
                           type="password"
                           name="password"
                           value={data.password}
                           autoComplete="new-password"
                           autoFocus={true}
                           onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="mt-4">
                    <Input label="Confirm Password"
                           crossOrigin={null}
                           color={"indigo"}
                           id="password_confirmation"
                           type="password"
                           name="password_confirmation"
                           value={data.password_confirmation}
                           autoComplete="new-password"
                           autoFocus={true}
                           onChange={(e) => setData('password_confirmation', e.target.value)}
                           required
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Button size={"sm"}
                            placeholder={null}
                            color={"blue"}
                            disabled={processing}
                            className="ml-4"
                            type="submit"
                    >Reset Password</Button>
                </div>
            </form>
        </GuestLayout>
    );
}
