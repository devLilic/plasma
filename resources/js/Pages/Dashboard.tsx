import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from '@inertiajs/react';
import {PageProps} from '@/types';
import Playlist from "@/Pages/Playlist/Playlist";

const Dashboard = ({auth}: PageProps) => {
    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Dashboard"/>

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-2">
                <Playlist/>
            </div>
        </AuthenticatedLayout>
    );
}

export default Dashboard;
