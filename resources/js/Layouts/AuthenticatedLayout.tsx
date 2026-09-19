import {PropsWithChildren, ReactNode} from 'react';
import {User} from '@/types';
import MainNavigation from "@/Components/Navigation/MainNavigation";

interface AuthenticatedPageProps extends PropsWithChildren {
    user: User
    headerAction?: ReactNode
}

const Authenticated = ({user, headerAction, children}: AuthenticatedPageProps) => {
    return (
        <div className="plasma-shell">
            <div className="plasma-ambient" aria-hidden="true"/>
            <MainNavigation user={user} headerAction={headerAction}/>
            <main>{children}</main>
        </div>
    );
}

export default Authenticated;
