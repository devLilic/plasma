import React, {ForwardedRef, forwardRef} from 'react';
import {Tab as TabMaterial, TabProps} from "@material-tailwind/react";

const Tab = forwardRef((props: TabProps, ref: ForwardedRef<HTMLLIElement>) =>
    <TabMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default Tab;
