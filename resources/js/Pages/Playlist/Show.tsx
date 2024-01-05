import React from 'react';
import {Head} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {PageProps} from "@/types";
import {Card} from "@material-tailwind/react";


const Show = ({auth}: PageProps) => {
    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Playlist"/>

            <div className="flex flex-row justify-around items-start">
                <Card className="flex-1">
                    playlost
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;
