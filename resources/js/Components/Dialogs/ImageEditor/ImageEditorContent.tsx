import React from 'react';
import {ArrowUpTrayIcon, GlobeAltIcon, PhotoIcon} from '@heroicons/react/24/outline';
import {TabPanel, Tabs} from '@material-tailwind/react';
import LocalTab from '@/Components/Dialogs/ImageEditor/LocalTab';
import GoogleTab from '@/Components/Dialogs/ImageEditor/GoogleTab';
import UploadTab from '@/Components/Dialogs/ImageEditor/UploadTab';
import Tab from '@/Components/Material/Tab';
import TabsHeader from '@/Components/Material/TabHeader';
import TabsBody from '@/Components/Material/TabsBody';

interface ImageEditorContentProps {
    onImageSelected?: () => void
}

const ImageEditorContent = ({onImageSelected = () => undefined}: ImageEditorContentProps) => {
    const tabs = [
        {value: 'external', label: 'Internet', icon: GlobeAltIcon},
        {value: 'local', label: 'Bibliotecă', icon: PhotoIcon},
        {value: 'upload', label: 'Încarcă', icon: ArrowUpTrayIcon},
    ];

    return (
        <Tabs value="external">
            <TabsHeader className="!mx-auto !mb-5 !max-w-xl !rounded-[16px] !border !border-white/60 !bg-white/30 !p-1"
                        indicatorProps={{className: 'rounded-[12px] bg-white/90 shadow-[0_5px_16px_rgba(54,73,115,0.1)] ring-1 ring-white'}}>
                {tabs.map(item => (
                    <Tab key={item.value} value={item.value} activeClassName="text-[#286ee7]" className="!py-2 text-[#65728a]">
                        <span className="flex items-center justify-center gap-2 text-xs font-semibold sm:text-sm">
                            <item.icon className="h-4 w-4"/>{item.label}
                        </span>
                    </Tab>
                ))}
            </TabsHeader>
            <TabsBody>
                <TabPanel value="external" className="!p-0"><GoogleTab handleModal={onImageSelected}/></TabPanel>
                <TabPanel value="local" className="!p-0"><LocalTab handleModal={onImageSelected}/></TabPanel>
                <TabPanel value="upload" className="!p-0"><UploadTab handleModal={onImageSelected}/></TabPanel>
            </TabsBody>
        </Tabs>
    );
};

export default ImageEditorContent;
