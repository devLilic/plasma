import React from 'react';
import {Tabs as MaterialTabs, Tab, TabPanel, TabsBody, TabsHeader} from "@material-tailwind/react";
import LocalTab from "@/Shared/Dialogs/ImageEditor/LocalTab";
import GoogleTab from "@/Shared/Dialogs/ImageEditor/GoogleTab";
import UploadTab from "@/Shared/Dialogs/ImageEditor/UploadTab";

const Tabs = ({selectImage, hideDialog}) => {
    return (
        <MaterialTabs id="custom-animation" value="local" className='min-w-full'>
            <TabsHeader>
                <Tab key="local" value="local">Imagini locale</Tab>
                <Tab key="external" value="external">Google</Tab>
                <Tab key="upload" value="upload">Upload</Tab>
            </TabsHeader>
            <TabsBody
                animate={{
                    mount: {y: 0},
                    unmount: {y: 250},
                }}>
                <LocalTab onSelectImage={selectImage}/>
                <GoogleTab onSelectImage={selectImage} hideDialog={hideDialog}/>
                <UploadTab onSelectImage={selectImage}/>
            </TabsBody>
        </MaterialTabs>
    );
};

export default Tabs;
