import React, {ForwardedRef, forwardRef} from 'react';
import {Progress as ProgressMaterial, ProgressProps} from "@material-tailwind/react";

const Progress = forwardRef((props: ProgressProps, ref: ForwardedRef<HTMLDivElement>) =>
    <ProgressMaterial {...props}
                  placeholder={null}
                  ref={ref}/>)

export default Progress;
