import React, {ForwardedRef, forwardRef} from 'react';
import {Button as ButtonMaterial, ButtonProps} from "@material-tailwind/react";

const Button = forwardRef((props: ButtonProps, ref: ForwardedRef<HTMLButtonElement>) =>
    <ButtonMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default Button;
