import {PropsWithChildren, useState} from 'react';
import {User} from '@/types';
import MainNavigation from "@/Components/Navigation/MainNavigation";

interface AuthenticatedPageProps extends PropsWithChildren {
    user: User
}

const Authenticated = ({user, children}: AuthenticatedPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="min-h-screen bg-gray-100">
            <MainNavigation user={user}/>

            <main>
                <div className="py-4">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Authenticated;
