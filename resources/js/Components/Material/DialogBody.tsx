import React, {ForwardedRef, forwardRef} from 'react';
import {DialogBody as DialogBodyMaterial, DialogBodyProps} from "@material-tailwind/react";

const DialogBody = forwardRef((props: DialogBodyProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogBodyMaterial {...props}
                    className={`!min-h-0 !flex-1 !overflow-y-auto !overscroll-contain !px-5 !py-5 !text-[#172033] sm:!px-6 ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default DialogBody;
