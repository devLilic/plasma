import React from 'react';
import Button from "@/Components/Material/Button";
import GoogleIcon from "@/Components/UI/Svg/GoogleIcon";
import YandexIcon from "@/Components/UI/Svg/YandexIcon";
import {IconButton} from "@material-tailwind/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faGoogle, faYandex } from "@fortawesome/free-brands-svg-icons";

interface SearchExternalImagesProps {
    query: string
    withModal?: () => void
}

const SearchExternalImages = ({query, withModal}: SearchExternalImagesProps) => {
    const searchOn = (engine: "google" | 'yandex') => {
        let url = ''
        let search_query = query.split(' ').join('+')
        if (engine === 'google') {
            url = `https://www.google.com/search?q=${search_query}&source=lnms&tbm=isch&tbs=isz:l`
        } else if (engine === 'yandex') {
            url = `https://yandex.com/images/search?isize=large&text=${search_query}`
        }
        window.open(url, '_blank', 'noopener,noreferrer')
        if (withModal){
            withModal()
        }
    }
    return (
        <>
            <IconButton placeholder={undefined}
                        variant='outlined'
                        color='purple'
                        className='my-1 px-2 py-2'
                        onClick={() => searchOn('google')}>
                    <FontAwesomeIcon icon={faGoogle} size='lg'/>
            </IconButton>
            <IconButton placeholder={undefined}
                        variant='outlined'
                        color='purple'
                        className='my-1 px-2 py-2'
                        onClick={() => searchOn('yandex')}>
                <FontAwesomeIcon icon={faYandex} size='lg' className='font-bold text-xl'/>
            </IconButton>
            {/*<Button variant="outlined"*/}
            {/*        size='sm'*/}
            {/*        color='purple'*/}
            {/*        className='my-1 py-2'*/}
            {/*        onClick={() => searchOn('google')}*/}
            {/*><GoogleIcon/></Button>*/}
            {/*<Button variant="outlined"*/}
            {/*        color='purple'*/}
            {/*        size='sm'*/}
            {/*        className='my-1 py-2'*/}
            {/*        onClick={() => searchOn("yandex")}*/}
            {/*><YandexIcon/></Button>*/}
        </>
    );
};

export default SearchExternalImages;
