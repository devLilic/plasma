import React from 'react';
import ResponsiveNavLink from "@/Components/Navigation/ResponsiveNavLink";
import {User} from "@/types";

interface MobileNavigationProps {
    showingNavigationDropdown: boolean
    user: User
}

const MobileNavigation = ({showingNavigationDropdown, user}: MobileNavigationProps) => {
    return (
        <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
            <div className="pt-2 pb-3 space-y-1">
                <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                    Dashboard
                </ResponsiveNavLink>
            </div>

            <div className="pt-4 pb-1 border-t border-gray-200">
                <div className="px-4">
                    <div className="font-medium text-base text-gray-800">
                        {user.name}
                    </div>
                    <div className="font-medium text-sm text-gray-500">{user.email}</div>
                </div>

                <div className="mt-3 space-y-1">
                    <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                    <ResponsiveNavLink method="post" href={route('logout')} as="button">
                        Log Out
                    </ResponsiveNavLink>
                </div>
            </div>
        </div>
    );
};

export default MobileNavigation;
