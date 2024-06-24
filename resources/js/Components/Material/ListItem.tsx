import React, {ForwardedRef, forwardRef} from 'react';
import {ListItem as ListItemMaterial, ListItemProps} from "@material-tailwind/react";

const ListItem = forwardRef((props: ListItemProps, ref: ForwardedRef<HTMLDivElement>) =>
    <ListItemMaterial {...props}
                  placeholder={null}
                  ref={ref}/>)

export default ListItem;
