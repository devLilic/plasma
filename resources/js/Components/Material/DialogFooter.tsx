import React, {ForwardedRef, forwardRef} from 'react';
import {DialogFooter as DialogFooterMaterial, DialogFooterProps} from "@material-tailwind/react";

const DialogFooter = forwardRef((props: DialogFooterProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogFooterMaterial {...props}
                    className={`!shrink-0 !gap-2 !border-t !border-[#71809a]/10 !bg-white/25 !px-5 !py-4 sm:!px-6 ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default DialogFooter;
