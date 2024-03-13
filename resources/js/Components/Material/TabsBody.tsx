import React, {ForwardedRef, forwardRef} from 'react';
import {TabsBody as TabsMaterial, TabsBodyProps} from "@material-tailwind/react";

const TabsBody = forwardRef((props: TabsBodyProps, ref: ForwardedRef<HTMLDivElement>) =>
    <TabsMaterial {...props}
                  placeholder={null}
                  ref={ref}/>)

export default TabsBody;
