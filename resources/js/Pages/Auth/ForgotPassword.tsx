import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import {Button, Input, Typography} from "@material-tailwind/react";
import InputError from "@/Components/InputError";

interface ForgotPasswordProps{
    status?: string
}

const ForgotPassword = ({ status }: ForgotPasswordProps) => {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-4 text-sm text-gray-600">
                Forgot your password? No problem. Just let us know your email address and we will email you a password
                reset link that will allow you to choose a new one.
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <Input label="Email"
                       crossOrigin={null}
                       color={"indigo"}
                       id="email"
                       type="email"
                       name="email"
                       value={data.email}
                       autoFocus={true}
                       onChange={(e) => setData('email', e.target.value)}
                />
                <InputError message={errors.email} />

                <div className="flex items-center justify-end mt-4">
                    <Button size={"sm"}
                            placeholder={null}
                            color={"blue"}
                            disabled={processing}
                            type="submit"
                    >Email Password Reset Link</Button>
                </div>
            </form>
        </GuestLayout>
    );
}
export default ForgotPassword;
