import React, {ForwardedRef, forwardRef} from 'react';
import {TabsHeader as TabsHeaderMaterial, TabsHeaderProps} from "@material-tailwind/react";

const TabsHeader = forwardRef((props: TabsHeaderProps, ref: ForwardedRef<HTMLUListElement>) =>
    <TabsHeaderMaterial {...props}
                    placeholder={null}
                    ref={ref}/>)

export default TabsHeader;
