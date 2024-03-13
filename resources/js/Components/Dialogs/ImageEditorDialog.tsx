import React from 'react';
import {
    Popover, PopoverHandler,
    TabPanel,
    Tabs,
} from "@material-tailwind/react";
import LocalTab from "@/Components/Dialogs/ImageEditor/LocalTab";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {selectArticleById} from "@/Store/article/article.slice";
import GoogleTab from "@/Components/Dialogs/ImageEditor/GoogleTab";
import Dialog from "@/Components/Material/Dialog";
import DialogHeader from "@/Components/Material/DialogHeader";
import Button from "@/Components/Material/Button";
import DialogBody from "@/Components/Material/DialogBody";
import DialogFooter from "@/Components/Material/DialogFooter";
import Tab from "@/Components/Material/Tab";
import TabsHeader from "@/Components/Material/TabHeader";
import TabsBody from "@/Components/Material/TabsBody";
import PopoverContent from "@/Components/Material/PopoverContent";
import UploadTab from "@/Components/Dialogs/ImageEditor/UploadTab";
import {Article} from "@/types";

interface ImageEditorDialogProps {
    isOpen: boolean,
    handleDialog: () => void
}

const ImageEditorDialog = ({isOpen, handleDialog}: ImageEditorDialogProps) => {
    const article: Article = useTypedSelector(state => selectArticleById(state, state.articles.current));
    return (
        <Dialog size='xl' open={isOpen} handler={handleDialog}>
            <DialogHeader className='text-lg bg-gray-100 rounded-t-2xl border flex justify-between'>
                <div>
                    <p>{article?.block_title}</p>
                </div>
                <div>
                    {article?.intro && <Popover>
                        <PopoverHandler>
                            <Button variant="outlined"
                                    color='purple'
                                    className='my-1 py-3'
                            >Intro</Button>
                        </PopoverHandler>
                        <PopoverContent
                            className="z-[10000] bg-yellow-100 max-w-[300px]"
                        >{article?.intro}</PopoverContent>
                    </Popover>}
                </div>
            </DialogHeader>
            <DialogBody className='border-t border-b min-h-[600px]'>
                <Tabs value='local'>
                    <TabsHeader indicatorProps={{
                        className: "bg-purple-300"
                    }}>
                        <Tab key="local" activeClassName='text-white' value="local">Imagini
                            locale</Tab>
                        <Tab key="external" activeClassName='text-white' value="external"
                        >Google</Tab>
                        <Tab key="upload" activeClassName='text-white' value="upload"
                        >Upload</Tab>
                    </TabsHeader>
                    <TabsBody
                    >
                        <TabPanel key='local' value='local' className='w-full'>
                            <LocalTab handleModal={handleDialog}/>
                        </TabPanel>
                        <TabPanel key='external' value='external' className='w-full'>
                            <GoogleTab handleModal={handleDialog}/>
                        </TabPanel>
                        <TabPanel key='upload' value='upload' className='w-full'>
                            <UploadTab handleModal={handleDialog}/>
                        </TabPanel>
                    </TabsBody>
                </Tabs>


            </DialogBody>
            <DialogFooter>
                <Button size='sm'
                        onClick={handleDialog}
                        variant='outlined'
                >Close</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
