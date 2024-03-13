import React, {ForwardedRef, forwardRef} from 'react';
import {DialogFooter as DialogFooterMaterial, DialogFooterProps} from "@material-tailwind/react";

const DialogFooter = forwardRef((props: DialogFooterProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogFooterMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default DialogFooter;
