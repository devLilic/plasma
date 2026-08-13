import React, {ForwardedRef, forwardRef} from 'react';
import {Dialog as DialogMaterial, DialogProps} from "@material-tailwind/react";

const Dialog = forwardRef((props: DialogProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogMaterial {...props}
                    className={`!max-h-[calc(100vh-2rem)] !overflow-hidden !rounded-[28px] !border !border-white/80 !bg-white/95 !shadow-[0_24px_80px_rgba(0,0,0,0.24)] !backdrop-blur-2xl ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default Dialog;
