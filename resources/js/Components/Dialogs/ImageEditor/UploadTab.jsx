import React from 'react';
import {TabPanel} from "@material-tailwind/react";
// import UploadForm from "@/Shared/ImagesUpload/UploadForm";

const UploadTab = (props) => {
    return (
        <TabPanel key='upload' value="upload" className="w-full">
            {/*<UploadForm />*/}
            Upload
        </TabPanel>
    );
};

export default UploadTab;
