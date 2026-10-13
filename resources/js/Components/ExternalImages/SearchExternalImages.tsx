import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGoogle, faYandex} from '@fortawesome/free-brands-svg-icons';

interface SearchExternalImagesProps {
    query: string
    withModal?: () => void
}

export const googleImagesSearchUrl = (query: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(query)}&source=lnms&tbm=isch&tbs=isz:lt,islt:vga,iar:w`;

export const openGoogleImagesSearch = (query: string) =>
    window.open(googleImagesSearchUrl(query), '_blank', 'noopener,noreferrer');

const SearchExternalImages = ({query, withModal}: SearchExternalImagesProps) => {
    const searchOn = (engine: 'google' | 'yandex') => {
        const searchQuery = encodeURIComponent(query);
        if (engine === 'google') openGoogleImagesSearch(query);
        else window.open(`https://yandex.com/images/search?isize=large&text=${searchQuery}`, '_blank', 'noopener,noreferrer');
        withModal?.();
    };

    return (
        <>
            <button type="button" onClick={() => searchOn('google')} className="ios-secondary-button !min-h-9 !px-2.5" aria-label="Caută imagine pe Google">
                <FontAwesomeIcon icon={faGoogle}/>
            </button>
            <button type="button" onClick={() => searchOn('yandex')} className="ios-secondary-button !min-h-9 !px-2.5" aria-label="Caută imagine pe Yandex">
                <FontAwesomeIcon icon={faYandex}/>
            </button>
        </>
    );
};

export default SearchExternalImages;
