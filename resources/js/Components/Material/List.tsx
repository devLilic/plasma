import React, {ForwardedRef, forwardRef} from 'react';
import {List as ListMaterial, ListProps} from "@material-tailwind/react";

const List = forwardRef((props: ListProps, ref: ForwardedRef<HTMLDivElement>) =>
    <ListMaterial {...props}
                        placeholder={null}
                  ref={ref}/>)

export default List;
