import React, {ForwardedRef, forwardRef} from 'react';
import {PopoverContent as PopoverContentMaterial, PopoverContentProps} from "@material-tailwind/react";

const PopoverContent = forwardRef((props: PopoverContentProps, ref: ForwardedRef<HTMLDivElement>) =>
    <PopoverContentMaterial {...props}
                            placeholder={null}
                            ref={ref}/>)

export default PopoverContent;
