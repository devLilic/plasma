import React, {ForwardedRef, forwardRef} from 'react';
import {Dialog as DialogMaterial, DialogProps} from "@material-tailwind/react";

const Dialog = forwardRef((props: DialogProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default Dialog;
