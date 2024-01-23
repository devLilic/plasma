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
import LocalTab from "@/Components/Dialogs/ImageEditor/LocalTab";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectArticleById} from "@/Store/article/article.slice";

interface ImageEditorDialogProps {
    isOpen: boolean,
    handleDialog: () => void
}

const ImageEditorDialog = ({isOpen, handleDialog}: ImageEditorDialogProps) => {
    const article = useTypedSelector(state => selectArticleById(state, state.articles.current));
    return (
        <Dialog size='xl' open={isOpen} handler={handleDialog} placeholder={undefined}>
            <DialogHeader className='text-lg bg-gray-100 rounded-t-2xl border flex justify-between'
                          placeholder={undefined}>
                <div>
                    <p>{article?.title}</p>
                    <p className='text-sm mt-2'>{article?.subtitle}</p>
                </div>
                <div>
                    {article && <Popover>
                        <PopoverHandler>
                            <Button variant="outlined"
                                    color='purple'
                                    className='my-1 py-3'
                                    placeholder={undefined}>Intro</Button>
                        </PopoverHandler>
                        <PopoverContent
                            className="z-[10000] bg-yellow-100 max-w-[300px]"
                            placeholder={undefined}
                        >{article?.intro}</PopoverContent>
                    </Popover>}
                </div>
            </DialogHeader>
            <DialogBody className='border-t border-b min-h-[500px]' placeholder={undefined}>
                <Tabs value='local'>
                    <TabsHeader placeholder={undefined} indicatorProps={{
                        className: "bg-purple-300"
                    }}>
                        <Tab key="local" activeClassName='text-white' value="local" placeholder={undefined}>Imagini locale</Tab>
                        <Tab key="external" activeClassName='text-white'  value="external" placeholder={undefined}>Google</Tab>
                        <Tab key="upload" activeClassName='text-white' value="upload" placeholder={undefined}>Upload</Tab>
                    </TabsHeader>
                    <TabsBody
                        placeholder={undefined}>
                        <TabPanel key='local' value='local' className='w-full'>
                            <LocalTab handleModal={handleDialog}/>
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
            <DialogFooter placeholder={undefined}>
                <Button size='sm'
                        onClick={handleDialog}
                        variant='outlined'
                        placeholder={undefined}
                >Close</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
