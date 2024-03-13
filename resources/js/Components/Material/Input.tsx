import React, {ForwardedRef, forwardRef} from 'react';
import {Input as InputMaterial, InputProps} from "@material-tailwind/react";

const Input = forwardRef((props: InputProps, ref: ForwardedRef<HTMLInputElement>) =>
    <InputMaterial {...props}
                   crossOrigin={null}
                   ref={ref}/>)

export default Input;
