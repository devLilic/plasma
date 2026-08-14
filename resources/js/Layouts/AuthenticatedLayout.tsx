import {PropsWithChildren} from 'react';
import {User} from '@/types';
import MainNavigation from "@/Components/Navigation/MainNavigation";

interface AuthenticatedPageProps extends PropsWithChildren {
    user: User
}

const Authenticated = ({user, children}: AuthenticatedPageProps) => {
    return (
        <div className="plasma-shell">
            <div className="plasma-ambient" aria-hidden="true"/>
            <MainNavigation user={user}/>
            <main>{children}</main>
        </div>
    );
}

export default Authenticated;
