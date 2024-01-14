import React from 'react';
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Tab, TabPanel,
    Tabs,
    TabsBody,
    TabsHeader
} from "@material-tailwind/react";
import {Article} from "@/types";
import LocalTab from "@/Components/Dialogs/ImageEditor/LocalTab";

interface ImageEditorDialogProps {
    isOpen: boolean,
    handleDialog: () => void
    article: Article
}

const ImageEditorDialog = ({isOpen, handleDialog, article}: ImageEditorDialogProps) => {

    return (
        <Dialog size='xl' open={isOpen} handler={handleDialog}>
            <DialogHeader className='text-lg bg-gray-100 rounded-t-2xl'>
                <div>
                    <p>{article.title}</p>
                    <p className='text-sm mt-2'>{article.subtitle}</p>
                </div>
            </DialogHeader>
            <DialogBody className='border-t border-b'>

                <Tabs value='local'>
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
                        <TabPanel key='local' value='local' className='w-full'>
                            <LocalTab />
                        </TabPanel>
                        <TabPanel key='external' value='external' className='w-full'>
                            Google
                        </TabPanel>
                        <TabPanel key='upload' value='upload' className='w-full'>
                            Upload
                        </TabPanel>

                        {/*<LocalTab onSelectImage={selectImage}/>*/}
                        {/*<GoogleTab onSelectImage={selectImage} hideDialog={hideDialog}/>*/}
                        {/*<UploadTab onSelectImage={selectImage}/>*/}
                    </TabsBody>
                </Tabs>


            </DialogBody>
            <DialogFooter>
                <Button size='sm'
                        onClick={handleDialog}
                        variant='outlined'>Close</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
