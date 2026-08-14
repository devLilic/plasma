import React, {ForwardedRef, forwardRef} from 'react';
import {DialogHeader as DialogHeaderMaterial, DialogHeaderProps} from "@material-tailwind/react";

const DialogHeader = forwardRef((props: DialogHeaderProps, ref: ForwardedRef<HTMLDivElement>) =>
    <DialogHeaderMaterial {...props}
                    className={`!shrink-0 !border-b !border-[#71809a]/10 !bg-white/20 !px-5 !py-4 !text-[#172033] sm:!px-6 ${props.className ?? ''}`}
                    placeholder={null}
                    ref={ref}/>)

export default DialogHeader;
