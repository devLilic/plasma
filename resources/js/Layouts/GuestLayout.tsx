import ApplicationLogo from '@/Components/UI/Logo/ApplicationLogo';
import {Link} from '@inertiajs/react';
import {PropsWithChildren} from 'react';

export default function Guest({children}: PropsWithChildren) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(10,132,255,0.16),_transparent_32rem)] px-4 py-10">
            <div className="w-full max-w-md">
                <Link href="/" className="mb-7 flex items-center justify-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#0a84ff] to-[#5856d6] shadow-[0_9px_24px_rgba(0,122,255,0.28)]">
                        <ApplicationLogo className="h-8 w-8 fill-white"/>
                    </span>
                    <span className="text-2xl font-bold tracking-[-0.04em] text-[#1c1c1e]">Plasma</span>
                </Link>
                <div className="ios-card overflow-hidden p-6 sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
