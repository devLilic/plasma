import { useEffect, FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import {Button, Input, Typography} from "@material-tailwind/react";
import InputError from "@/Components/InputError";

const ConfirmPassword = () => {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'));
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-4 text-sm text-gray-600">
                This is a secure area of the application. Please confirm your password before continuing.
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <Input label="Password"
                           crossOrigin={null}
                           color="indigo"
                           id="password"
                           type="password"
                           name="password"
                           value={data.password}
                           autoFocus={true}
                           onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Button
                            size={"sm"}
                            color={"blue"}
                            disabled={processing}
                            className="ml-4"
                            type="submit"
                            placeholder={null}
                    >Confirm</Button>
                </div>
            </form>
        </GuestLayout>
    );
}
