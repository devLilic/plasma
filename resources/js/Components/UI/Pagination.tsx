import React from 'react';
import {Link} from '@inertiajs/react';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {PaginatedResource} from '@/types';

interface PaginationProps {
    pagination: PaginatedResource<unknown>
}

const Pagination = ({pagination}: PaginationProps) => {
    if (pagination.meta.last_page <= 1) return null;

    const pages = pagination.meta.links.filter(link => /^\d+$/.test(link.label));

    return (
        <nav className="flex items-center justify-between gap-3 border-t border-[#e5e5ea] px-4 py-4" aria-label="Paginarea imaginilor">
            <p className="hidden text-xs font-medium text-[#8e8e93] sm:block">
                {pagination.meta.from}–{pagination.meta.to} din {pagination.meta.total}
            </p>
            <div className="flex flex-1 items-center justify-center gap-1 sm:justify-end">
                {pagination.links.prev ? (
                    <Link href={pagination.links.prev} preserveScroll preserveState className="flex h-9 w-9 items-center justify-center rounded-xl text-[#007aff] transition hover:bg-[#007aff]/10" aria-label="Pagina precedentă"><ChevronLeftIcon className="h-4 w-4"/></Link>
                ) : <span className="flex h-9 w-9 items-center justify-center text-[#c7c7cc]"><ChevronLeftIcon className="h-4 w-4"/></span>}

                {pages.map(page => page.url ? (
                    <Link key={page.label} href={page.url} preserveScroll preserveState className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${page.active ? 'bg-[#007aff] text-white' : 'text-[#6e6e73] hover:bg-[#f2f2f7]'}`} aria-current={page.active ? 'page' : undefined}>{page.label}</Link>
                ) : null)}

                {pagination.links.next ? (
                    <Link href={pagination.links.next} preserveScroll preserveState className="flex h-9 w-9 items-center justify-center rounded-xl text-[#007aff] transition hover:bg-[#007aff]/10" aria-label="Pagina următoare"><ChevronRightIcon className="h-4 w-4"/></Link>
                ) : <span className="flex h-9 w-9 items-center justify-center text-[#c7c7cc]"><ChevronRightIcon className="h-4 w-4"/></span>}
            </div>
        </nav>
    );
};

export default Pagination;
