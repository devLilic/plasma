import { useEffect, FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {Input, Typography, Button} from "@material-tailwind/react";
import InputError from "@/Components/InputError";

interface RegisterFormData{
    name: string
    email: string
    password: string
    password_confirmation: string
}

const Register = () => {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterFormData>({
        name: '',
        email: '',
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

        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <Input label="Name"
                           color={"indigo"}
                           id="name"
                           name="name"
                           value={data.name}
                           autoComplete="name"
                           autoFocus={true}
                           onChange={(e) => setData('name', e.target.value)}
                           required
                    />
                    <InputError message={errors.name} />

                </div>

                <div className="mt-4">
                    <Input label="Email"
                           color={"indigo"}
                           id="email"
                           type="email"
                           name="email"
                           value={data.email}
                           onChange={(e) => setData('email', e.target.value)}
                           required
                    />
                    <InputError message={errors.email} />

                </div>

                <div className="mt-4">
                    <Input label="Password"
                           color={"indigo"}
                           id="password"
                           type="password"
                           name="password"
                           value={data.password}
                           autoComplete="new-password"
                           onChange={(e) => setData('password', e.target.value)}
                           required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="mt-4">
                    <Input label="Confirm Password"
                           color={"indigo"}
                           id="password_confirmation"
                           type="password"
                           name="password_confirmation"
                           value={data.password_confirmation}
                           autoComplete="new-password"
                           onChange={(e) => setData('password_confirmation', e.target.value)}
                           required
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Link
                        href={route('login')}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Already registered?
                    </Link>

                    <Button size={"sm"}
                            color={"blue"}
                            disabled={processing}
                            className="ml-4"
                            type="submit"
                    >Register</Button>
                </div>
            </form>
        </GuestLayout>
    );
}

export default Register;
