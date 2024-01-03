import React from 'react';
import {Typography} from "@material-tailwind/react";

const InputError = ({message}: { message: string | undefined }) => {
    return (
        <>
            {message && (<Typography color="red" variant='small'>
                {message}
            </Typography>)}
        </>
    );
};

export default InputError;
