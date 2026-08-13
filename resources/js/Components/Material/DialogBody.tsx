import React, {ForwardedRef, forwardRef} from 'react';
import {DialogBody as DialogBodyMaterial, DialogBodyProps} from "@material-tailwind/react";

const DialogBody = forwardRef((props: DialogBodyProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogBodyMaterial {...props}
                    className={`!overflow-y-auto !px-5 !py-5 !text-[#1c1c1e] sm:!px-6 ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default DialogBody;
