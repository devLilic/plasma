import React, {useState} from 'react';
import {Link} from '@inertiajs/react';
import {Button, Menu, MenuHandler, MenuItem, MenuList, Typography} from '@material-tailwind/react';
import {
    ArrowRightStartOnRectangleIcon,
    ArrowUpTrayIcon,
    ChevronDownIcon,
    PhotoIcon,
    QueueListIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ApplicationLogo from '@/Components/UI/Logo/ApplicationLogo';
import {User} from '@/types';

interface MainNavigationProps {
    user: User
}

const MainNavigation = ({user}: MainNavigationProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = [
        {label: 'Playlisturi', href: route('playlists.index'), active: route().current('playlists.*'), icon: QueueListIcon},
        {label: 'Imagini', href: route('images.index'), active: route().current('images.index'), icon: PhotoIcon},
        {label: 'Încarcă', href: route('images.create'), active: route().current('images.create'), icon: ArrowUpTrayIcon},
    ];

    return (
        <>
            <nav className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-2xl">
                <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href={route('playlists.index')} className="flex items-center gap-3" aria-label="Plasma">
                            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#0a84ff] to-[#5856d6] shadow-[0_5px_16px_rgba(0,122,255,0.25)]">
                                <ApplicationLogo className="h-6 w-6 fill-white"/>
                            </span>
                            <span className="hidden text-lg font-bold tracking-[-0.03em] text-[#1c1c1e] sm:block">Plasma</span>
                        </Link>

                        <div className="hidden items-center gap-1 md:flex">
                            {navigation.map(item => (
                                <Link key={item.label} href={item.href}
                                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${item.active ? 'bg-[#007aff]/10 text-[#007aff]' : 'text-[#6e6e73] hover:bg-black/5 hover:text-[#1c1c1e]'}`}>
                                    <item.icon className="h-5 w-5"/>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Menu open={menuOpen} handler={setMenuOpen} placement="bottom-end">
                        <MenuHandler>
                            <Button placeholder={null} variant="text" color="blue-gray"
                                    className="flex items-center gap-2 rounded-xl bg-[#f2f2f7] py-1.5 pl-2 pr-3 normal-case shadow-none hover:shadow-none">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-sm font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <Typography className="hidden text-sm font-semibold normal-case text-[#1c1c1e] sm:block">{user.name}</Typography>
                                <ChevronDownIcon className={`h-4 w-4 text-[#8e8e93] transition-transform ${menuOpen ? 'rotate-180' : ''}`}/>
                            </Button>
                        </MenuHandler>
                        <MenuList className="z-50 min-w-[210px] rounded-2xl border border-black/5 bg-white/95 p-2 shadow-xl backdrop-blur-xl" placeholder={null}>
                            <MenuItem className="p-0" placeholder={null}>
                                <Link href={route('profile.edit')} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#1c1c1e]">
                                    <Cog6ToothIcon className="h-5 w-5 text-[#007aff]"/>
                                    Setări
                                </Link>
                            </MenuItem>
                            <hr className="my-1 border-[#e5e5ea]"/>
                            <Link href={route('logout')} method="post" as="button"
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/5">
                                <ArrowRightStartOnRectangleIcon className="h-5 w-5"/>
                                Deconectare
                            </Link>
                        </MenuList>
                    </Menu>
                </div>
            </nav>

            <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-[22px] border border-white/80 bg-white/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:hidden">
                {navigation.map(item => (
                    <Link key={item.label} href={item.href}
                          className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold ${item.active ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}>
                        <item.icon className="h-6 w-6" strokeWidth={item.active ? 2.2 : 1.7}/>
                        {item.label}
                    </Link>
                ))}
            </nav>
        </>
    );
};

export default MainNavigation;
