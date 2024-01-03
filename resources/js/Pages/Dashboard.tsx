import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from '@inertiajs/react';
import {PageProps} from '@/types';
import {Button, Card} from "@material-tailwind/react";

const Dashboard = ({auth}: PageProps) => {
    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Dashboard"/>

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-2">
                <div className="p-6 text-gray-900">You're logged in!</div>
                <Button placeholder='Select' color="green" variant='filled' size='sm'>Select</Button>
            </div>
        </AuthenticatedLayout>
    );
}

export default Dashboard;
