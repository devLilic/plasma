import React, {ForwardedRef, forwardRef} from 'react';
import {Dialog as DialogMaterial, DialogProps} from "@material-tailwind/react";

const Dialog = forwardRef((props: DialogProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogMaterial {...props}
                    className={`liquid-dialog !flex !max-h-[calc(100dvh-2rem)] !flex-col !overflow-hidden !rounded-[30px] !border !border-white/85 !shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_30px_100px_rgba(23,37,74,0.28)] ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default Dialog;
