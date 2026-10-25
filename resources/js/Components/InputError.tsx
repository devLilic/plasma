import React from 'react';
import {Typography} from "@material-tailwind/react";

const InputError = ({message}: { message: string | undefined }) => {
    return (
        <>
            {message && (<div role="alert"><Typography color="red" variant='small'>
                {message}
            </Typography></div>)}
        </>
    );
};

export default InputError;
