import {PropsWithChildren} from 'react';
import {User} from '@/types';
import MainNavigation from "@/Components/Navigation/MainNavigation";

interface AuthenticatedPageProps extends PropsWithChildren {
    user: User
}

const Authenticated = ({user, children}: AuthenticatedPageProps) => {
    return (
        <div className="min-h-screen bg-transparent">
            <MainNavigation user={user}/>
            <main>{children}</main>
        </div>
    );
}

export default Authenticated;
