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
            <nav className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
                <div className="glass-nav mx-auto flex h-[68px] max-w-[1400px] items-center justify-between rounded-[24px] px-3 sm:px-4 lg:px-5">
                    <div className="flex items-center gap-8">
                        <Link href={route('playlists.index')} className="flex items-center gap-3 rounded-2xl" aria-label="Plasma">
                            <ApplicationLogo className="h-10 w-10"/>
                            <span className="hidden sm:block">
                                <span className="block text-[17px] font-bold leading-4 tracking-[-0.035em] text-[#172033]">Plasma</span>
                                <span className="mt-1 block text-[9px] font-bold uppercase leading-none tracking-[0.16em] text-[#7c899d]">Media flow</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-1 rounded-[16px] bg-white/35 p-1 ring-1 ring-white/60 md:flex">
                            {navigation.map(item => (
                                <Link key={item.label} href={item.href}
                                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${item.active ? 'bg-white/90 text-[#286ee7] shadow-[0_4px_14px_rgba(63,82,126,0.1)] ring-1 ring-white' : 'text-[#65728a] hover:bg-white/50 hover:text-[#172033]'}`}>
                                    <item.icon className="h-5 w-5"/>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Menu open={menuOpen} handler={setMenuOpen} placement="bottom-end">
                        <MenuHandler>
                            <Button placeholder={null} variant="text" color="blue-gray"
                                    className="flex items-center gap-2 rounded-[16px] border border-white/70 bg-white/45 py-1.5 pl-2 pr-3 normal-case shadow-none backdrop-blur-xl hover:bg-white/70 hover:shadow-none">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2da7f8] to-[#6f59ee] text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_12px_rgba(64,92,196,0.2)]">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <Typography className="hidden text-sm font-semibold normal-case text-[#172033] sm:block">{user.name}</Typography>
                                <ChevronDownIcon className={`h-4 w-4 text-[#7c899d] transition-transform ${menuOpen ? 'rotate-180' : ''}`}/>
                            </Button>
                        </MenuHandler>
                        <MenuList className="z-50 min-w-[210px] rounded-[20px] border border-white/80 bg-white/75 p-2 shadow-[0_18px_50px_rgba(42,55,94,0.18)] backdrop-blur-2xl" placeholder={null}>
                            <MenuItem className="p-0" placeholder={null}>
                                <Link href={route('profile.edit')} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#172033] hover:bg-white/70">
                                    <Cog6ToothIcon className="h-5 w-5 text-[#286ee7]"/>
                                    Setări
                                </Link>
                            </MenuItem>
                            <hr className="my-1 border-[#71809a]/15"/>
                            <Link href={route('logout')} method="post" as="button"
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/5">
                                <ArrowRightStartOnRectangleIcon className="h-5 w-5"/>
                                Deconectare
                            </Link>
                        </MenuList>
                    </Menu>
                </div>
            </nav>

            <nav className="glass-nav fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-[24px] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
                {navigation.map(item => (
                    <Link key={item.label} href={item.href}
                          className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition ${item.active ? 'bg-white/65 text-[#286ee7] shadow-sm' : 'text-[#7c899d]'}`}>
                        <item.icon className="h-6 w-6" strokeWidth={item.active ? 2.2 : 1.7}/>
                        {item.label}
                    </Link>
                ))}
            </nav>
        </>
    );
};

export default MainNavigation;
