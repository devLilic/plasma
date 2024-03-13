import React, {ForwardedRef, forwardRef} from 'react';
import {DialogBody as DialogBodyMaterial, DialogBodyProps} from "@material-tailwind/react";

const DialogBody = forwardRef((props: DialogBodyProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogBodyMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default DialogBody;
