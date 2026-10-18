import React, {useEffect, useState} from 'react';
import {ArrowUpTrayIcon, GlobeAltIcon, PhotoIcon, TvIcon} from '@heroicons/react/24/outline';
import {TabPanel, Tabs} from '@material-tailwind/react';
import LocalTab from '@/Components/Dialogs/ImageEditor/LocalTab';
import GoogleTab from '@/Components/Dialogs/ImageEditor/GoogleTab';
import UploadTab from '@/Components/Dialogs/ImageEditor/UploadTab';
import Tab from '@/Components/Material/Tab';
import TabsHeader from '@/Components/Material/TabHeader';
import TabsBody from '@/Components/Material/TabsBody';
import {Article} from '@/types';

type ImageEditorTab = 'external' | 'local' | 'upload' | 'plasma';

interface ImageEditorContentProps {
    onImageSelected?: () => void
    article: Article
    initialTab?: ImageEditorTab
    allowUpload?: boolean
    autoFocusLibrarySearch?: boolean
    operatorMode?: boolean
    plasmaContent?: React.ReactNode
    internetContent?: React.ReactNode
    operatorLeadingAction?: React.ReactNode
}

const ImageEditorContent = ({onImageSelected = () => undefined, article, initialTab = 'external', allowUpload = true, autoFocusLibrarySearch = false, operatorMode = false, plasmaContent, internetContent, operatorLeadingAction}: ImageEditorContentProps) => {
    const [operatorTab, setOperatorTab] = useState<ImageEditorTab>(initialTab);
    useEffect(() => setOperatorTab(initialTab), [article.id, initialTab]);
    const tabs = [
        {value: 'external', label: 'Internet', icon: GlobeAltIcon},
        {value: 'local', label: 'Bibliotecă', icon: PhotoIcon},
        ...(allowUpload ? [{value: 'upload' as const, label: 'Încarcă', icon: ArrowUpTrayIcon}] : []),
    ] as const;

    if (operatorMode) return <div className="operator-image-editor">
        {operatorLeadingAction ? <div className="operator-image-tabs-row">
            {operatorLeadingAction}
            <nav className="operator-image-tabs" role="tablist" aria-label="Surse imagine">
                {(plasmaContent ? [{value: 'plasma', label: 'Plasma', icon: TvIcon}, ...tabs] : tabs).map(item => <button key={item.value} type="button" role="tab" aria-selected={operatorTab === item.value} className={operatorTab === item.value ? 'active' : ''} onClick={() => setOperatorTab(item.value as ImageEditorTab)}><item.icon className="h-4 w-4"/>{item.label}</button>)}
            </nav>
        </div> : <nav className="operator-image-tabs" role="tablist" aria-label="Surse imagine">
            {(plasmaContent ? [{value: 'plasma', label: 'Plasma', icon: TvIcon}, ...tabs] : tabs).map(item => <button key={item.value} type="button" role="tab" aria-selected={operatorTab === item.value} className={operatorTab === item.value ? 'active' : ''} onClick={() => setOperatorTab(item.value as ImageEditorTab)}><item.icon className="h-4 w-4"/>{item.label}</button>)}
        </nav>}
        {operatorTab === 'plasma' && plasmaContent}
        {operatorTab === 'external' && <>{internetContent}<GoogleTab article={article} onImageSelected={onImageSelected}/></>}
        {operatorTab === 'local' && <LocalTab article={article} onImageSelected={onImageSelected} autoFocusSearch={autoFocusLibrarySearch}/>}
        {operatorTab === 'upload' && allowUpload && <UploadTab handleModal={onImageSelected}/>}
    </div>;

    return (
        <Tabs value={initialTab === 'plasma' ? 'external' : initialTab}>
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
                <TabPanel value="external" className="!p-0"><GoogleTab article={article} onImageSelected={onImageSelected}/></TabPanel>
                <TabPanel value="local" className="!p-0"><LocalTab article={article} onImageSelected={onImageSelected} autoFocusSearch={autoFocusLibrarySearch}/></TabPanel>
                {allowUpload && <TabPanel value="upload" className="!p-0"><UploadTab handleModal={onImageSelected}/></TabPanel>}
            </TabsBody>
        </Tabs>
    );
};

export default ImageEditorContent;
