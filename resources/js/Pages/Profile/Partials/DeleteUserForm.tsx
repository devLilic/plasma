import React, {useRef, useState, FormEventHandler} from 'react';
import {useForm} from '@inertiajs/react';
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Input} from "@material-tailwind/react";
import InputError from "@/Components/InputError";

export default function DeleteUserForm({className = ''}: { className?: string }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement | null>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Delete Account</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Once your account is deleted, all of its resources and data will be permanently deleted. Before
                    deleting your account, please download any data or information that you wish to retain.
                </p>
            </header>

            <Button size="sm"
                    placeholder={null}
                    color="red"
                    onClick={confirmUserDeletion}
            >Delete Account</Button>

            <Dialog open={confirmingUserDeletion}
                    handler={closeModal}
                    size="sm"
                    placeholder={null}>
                <DialogHeader placeholder={null}>Are you sure you want to delete your account?</DialogHeader>
                <DialogBody placeholder={null}>
                    <p className="mt-1 text-sm text-gray-600">
                        Once your account is deleted, all of its resources and data will be permanently deleted. Please
                        enter your password to confirm you would like to permanently delete your account.
                    </p>

                    <div className="mt-6">
                        <Input label="Password"
                               crossOrigin={null}
                               color={"indigo"}
                               id="password"
                               type="password"
                               name="password"
                               value={data.password}
                               onChange={(e) => setData('password', e.target.value)}
                               inputRef={passwordInput}
                        />
                        <InputError message={errors.password}/>
                    </div>
                </DialogBody>
                <DialogFooter placeholder={null}>
                    <Button variant='outlined'
                            size="sm"
                            placeholder={null}
                            color="light-blue"
                            className="ms-3"
                            onClick={closeModal}
                    >Cancel</Button>

                    <Button size="sm"
                            placeholder={null}
                            color="red"
                            className="ms-3"
                            disabled={processing}
                            onClick={deleteUser}
                    >Delete Account</Button>
                </DialogFooter>
            </Dialog>

        </section>
    );
}
