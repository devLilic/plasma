import {saveAs} from 'file-saver';

export const imageFilename = (value: string, fallback = 'imagine'): string => {
    const stem = value
        .normalize('NFKC')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[.\s-]+|[.\s-]+$/g, '')
        .slice(0, 150) || fallback;

    return `${stem}.jpg`;
};

export const saveImageAs = (sourceUrl: string, filename: string): void => {
    const url = new URL(sourceUrl, window.location.origin);

    if (url.origin === window.location.origin && url.pathname.startsWith('/images/')) {
        url.searchParams.set('download_name', filename);
    }

    saveAs(url.toString(), filename);
};
