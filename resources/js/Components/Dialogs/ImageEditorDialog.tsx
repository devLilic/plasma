import React from 'react';
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader, Popover, PopoverContent, PopoverHandler,
    Tab, TabPanel,
    Tabs,
    TabsBody,
    TabsHeader
} from "@material-tailwind/react";
import {Article, PageProps} from "@/types";
import LocalTab from "@/Components/Dialogs/ImageEditor/LocalTab";

interface ImageEditorDialogProps {
    isOpen: boolean,
    handleDialog: () => void
    article: Article
}

const ImageEditorDialog = ({isOpen, handleDialog, article}: ImageEditorDialogProps) => {

    return (
        <Dialog size='xl' open={isOpen} handler={handleDialog} placeholder={undefined}>
            <DialogHeader className='text-lg bg-gray-100 rounded-t-2xl border flex justify-between'
                          placeholder={undefined}>
                <div>
                    <p>{article.title}</p>
                    <p className='text-sm mt-2'>{article.subtitle}</p>
                </div>
                <div>
                    <Popover>
                        <PopoverHandler>
                            <Button variant="outlined"
                                    color='purple'
                                    className='my-1 py-3'>Intro</Button>
                        </PopoverHandler>
                        <PopoverContent
                            className="z-[10000] bg-yellow-100 max-w-[300px]">{article.intro}</PopoverContent>
                    </Popover>
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
                            <LocalTab/>
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
