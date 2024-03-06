import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from '@inertiajs/react';
import {PageProps} from '@/types';
import PlaylistPage from "@/Pages/Playlist/PlaylistPage";

const Dashboard = ({auth}: PageProps) => {
    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Dashboard"/>

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-2">
                <PlaylistPage auth={auth}/>
            </div>
        </AuthenticatedLayout>
    );
}

export default Dashboard;
