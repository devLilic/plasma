import React from 'react';
import {ArrowUpTrayIcon, GlobeAltIcon, InformationCircleIcon, PhotoIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {Popover, PopoverHandler, TabPanel, Tabs} from '@material-tailwind/react';
import LocalTab from '@/Components/Dialogs/ImageEditor/LocalTab';
import GoogleTab from '@/Components/Dialogs/ImageEditor/GoogleTab';
import UploadTab from '@/Components/Dialogs/ImageEditor/UploadTab';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectArticleById} from '@/Store/article/article.slice';
import Dialog from '@/Components/Material/Dialog';
import DialogHeader from '@/Components/Material/DialogHeader';
import DialogBody from '@/Components/Material/DialogBody';
import DialogFooter from '@/Components/Material/DialogFooter';
import Tab from '@/Components/Material/Tab';
import TabsHeader from '@/Components/Material/TabHeader';
import TabsBody from '@/Components/Material/TabsBody';
import PopoverContent from '@/Components/Material/PopoverContent';
import {Article} from '@/types';

interface ImageEditorDialogProps {
    isOpen: boolean
    handleDialog: () => void
}

const ImageEditorDialog = ({isOpen, handleDialog}: ImageEditorDialogProps) => {
    const article: Article = useTypedSelector(state => selectArticleById(state, state.articles.current));
    const tabs = [
        {value: 'external', label: 'Internet', icon: GlobeAltIcon},
        {value: 'local', label: 'Bibliotecă', icon: PhotoIcon},
        {value: 'upload', label: 'Încarcă', icon: ArrowUpTrayIcon},
    ];

    return (
        <Dialog size="xl" open={isOpen} handler={handleDialog} className="!w-[calc(100%_-_1rem)]">
            <DialogHeader className="!flex !items-center !justify-between !gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#007aff]">Alege imaginea</p>
                    <h2 className="mt-1 truncate text-base font-semibold tracking-[-0.02em] sm:text-lg">{article?.block_title || 'Material'}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {article?.intro && (
                        <Popover>
                            <PopoverHandler>
                                <button type="button" className="ios-secondary-button !min-h-9 !px-3">
                                    <InformationCircleIcon className="h-4 w-4"/><span className="hidden sm:inline">Intro</span>
                                </button>
                            </PopoverHandler>
                            <PopoverContent className="z-[10000] max-w-sm rounded-2xl border border-black/5 bg-white/95 p-4 text-sm leading-6 text-[#1c1c1e] shadow-xl backdrop-blur-xl">
                                {article.intro}
                            </PopoverContent>
                        </Popover>
                    )}
                    <button type="button" onClick={handleDialog} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2f7] text-[#8e8e93] hover:bg-[#e5e5ea]" aria-label="Închide">
                        <XMarkIcon className="h-4 w-4"/>
                    </button>
                </div>
            </DialogHeader>
            <DialogBody className="!min-h-[min(620px,calc(100vh-12rem))] !overflow-x-hidden !p-3 sm:!p-5">
                <Tabs value="external">
                    <TabsHeader className="!mx-auto !mb-4 !max-w-xl !rounded-[14px] !bg-[#f2f2f7] !p-1"
                                indicatorProps={{className: 'rounded-[10px] bg-white shadow-sm'}}>
                        {tabs.map(item => (
                            <Tab key={item.value} value={item.value} activeClassName="text-[#007aff]" className="!py-2">
                                <span className="flex items-center justify-center gap-2 text-xs font-semibold sm:text-sm">
                                    <item.icon className="h-4 w-4"/>{item.label}
                                </span>
                            </Tab>
                        ))}
                    </TabsHeader>
                    <TabsBody>
                        <TabPanel value="external" className="!p-0"><GoogleTab handleModal={handleDialog}/></TabPanel>
                        <TabPanel value="local" className="!p-0"><LocalTab handleModal={handleDialog}/></TabPanel>
                        <TabPanel value="upload" className="!p-0"><UploadTab handleModal={handleDialog}/></TabPanel>
                    </TabsBody>
                </Tabs>
            </DialogBody>
            <DialogFooter className="!justify-end">
                <button type="button" onClick={handleDialog} className="ios-secondary-button !bg-white">Închide</button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
