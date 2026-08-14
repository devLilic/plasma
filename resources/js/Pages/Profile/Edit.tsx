import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import OldImagesCleanup from './Partials/OldImagesCleanup';
import ImageStorageSettings from './Partials/ImageStorageSettings';
import PlaylistTitleExclusionsSettings from './Partials/PlaylistTitleExclusionsSettings';

export default function Edit({ auth, mustVerifyEmail, status, imageStoragePath, playlistTitleExclusions }: PageProps<{ mustVerifyEmail: boolean, status?: string, imageStoragePath: string, playlistTitleExclusions: string[] }>) {
    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Setări" />

            <div className="ios-page">
                <div className="mx-auto max-w-3xl space-y-5">
                    <div className="mb-2">
                        <p className="ios-eyebrow">Preferințe</p>
                        <h1 className="ios-title">Setări</h1>
                        <p className="ios-subtitle">Gestionează biblioteca media, datele contului și securitatea.</p>
                    </div>
                    <PlaylistTitleExclusionsSettings initialTerms={playlistTitleExclusions}/>
                    <ImageStorageSettings initialPath={imageStoragePath}/>
                    <OldImagesCleanup />
                    <div className="ios-card p-5 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="ios-card p-5 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="ios-card p-5 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
