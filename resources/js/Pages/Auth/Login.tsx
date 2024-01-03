import {useEffect, FormEventHandler} from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import {Head, Link, useForm} from '@inertiajs/react';
import {Checkbox, Input, Typography, Button} from "@material-tailwind/react";
import InputError from "@/Components/InputError";

interface LoginProps {
    status?: string
    canResetPassword: boolean
}

interface FormData {
    email: string
    password: string
    remember: boolean
}

const Login = ({status, canResetPassword}: LoginProps) => {
    const {data, setData, post, processing, errors, reset} = useForm<FormData>({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Log in"/>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <div>
                    <Input label="Email"
                           color={"indigo"}
                           id="email"
                           type="email"
                           name="email"
                           value={data.email}
                           autoComplete="username"
                           autoFocus={true}
                           onChange={(e) => setData('email', e.target.value)}
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
                           autoComplete="current-password"
                           onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex mb-2">
                    <Checkbox
                        color="purple"
                        label='Remember me'
                        checked={data.remember}
                        onChange={e => setData('remember', e.target.checked)}
                    />
                </div>

                <div className="flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <Button type="submit" disabled={processing} size={'sm'} color={'blue'} className='ml-4'>Log in</Button>
                </div>
            </form>
        </GuestLayout>
    );
}

export default Login;
