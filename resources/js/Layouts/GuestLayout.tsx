import ApplicationLogo from '@/Components/UI/Logo/ApplicationLogo';
import {Link} from '@inertiajs/react';
import {PropsWithChildren} from 'react';

export default function Guest({children}: PropsWithChildren) {
    return (
        <div className="plasma-shell flex min-h-screen items-center justify-center px-4 py-10">
            <div className="plasma-ambient" aria-hidden="true"/>
            <div className="w-full max-w-[440px]">
                <Link href="/" className="mb-8 flex items-center justify-center gap-3.5 rounded-2xl" aria-label="Plasma — pagina principală">
                    <ApplicationLogo className="h-14 w-14"/>
                    <span>
                        <span className="block text-2xl font-bold tracking-[-0.045em] text-[#172033]">Plasma</span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#718098]">Media workspace</span>
                    </span>
                </Link>
                <div className="ios-card overflow-hidden p-6 sm:p-8">
                    {children}
                </div>
                <p className="mt-5 text-center text-xs text-[#7c899d]">Un spațiu fluid pentru biblioteca ta media.</p>
            </div>
        </div>
    );
}
