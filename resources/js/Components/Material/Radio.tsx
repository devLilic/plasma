import React, {ForwardedRef, forwardRef} from 'react';
import {Radio as RadioMaterial, RadioProps} from "@material-tailwind/react";

const Radio = forwardRef((props: RadioProps, ref: ForwardedRef<HTMLInputElement>) =>
    <RadioMaterial {...props}
                   crossOrigin={null}
                   ref={ref}/>)

export default Radio;
