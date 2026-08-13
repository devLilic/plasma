import React, {ForwardedRef, forwardRef} from 'react';
import {DialogFooter as DialogFooterMaterial, DialogFooterProps} from "@material-tailwind/react";

const DialogFooter = forwardRef((props: DialogFooterProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogFooterMaterial {...props}
                    className={`!gap-2 !border-t !border-[#e5e5ea] !bg-[#f9f9fb] !px-5 !py-4 sm:!px-6 ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default DialogFooter;
