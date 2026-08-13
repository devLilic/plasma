import React, {ForwardedRef, forwardRef} from 'react';
import {DialogHeader as DialogHeaderMaterial, DialogHeaderProps} from "@material-tailwind/react";

const DialogHeader = forwardRef((props: DialogHeaderProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogHeaderMaterial {...props}
                    className={`!border-b !border-[#e5e5ea] !px-5 !py-4 !text-[#1c1c1e] sm:!px-6 ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default DialogHeader;
