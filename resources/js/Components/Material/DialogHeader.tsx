import React, {ForwardedRef, forwardRef} from 'react';
import {DialogHeader as DialogHeaderMaterial, DialogHeaderProps} from "@material-tailwind/react";

const DialogHeader = forwardRef((props: DialogHeaderProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogHeaderMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default DialogHeader;
