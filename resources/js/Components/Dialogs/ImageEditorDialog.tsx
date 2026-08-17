import React from 'react';
import {InformationCircleIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {Popover, PopoverHandler} from '@material-tailwind/react';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {selectArticleById} from '@/Store/article/article.slice';
import Dialog from '@/Components/Material/Dialog';
import DialogHeader from '@/Components/Material/DialogHeader';
import DialogBody from '@/Components/Material/DialogBody';
import DialogFooter from '@/Components/Material/DialogFooter';
import PopoverContent from '@/Components/Material/PopoverContent';
import {Article} from '@/types';
import ImageEditorContent from '@/Components/Dialogs/ImageEditor/ImageEditorContent';

interface ImageEditorDialogProps {
    isOpen: boolean
    handleDialog: () => void
}

const ImageEditorDialog = ({isOpen, handleDialog}: ImageEditorDialogProps) => {
    const article: Article = useTypedSelector(state => selectArticleById(state, state.articles.current));
    if (!article) return null;

    return (
        <Dialog size="xl" open={isOpen} handler={handleDialog} className="!w-[calc(100%_-_1rem)]">
            <DialogHeader className="!flex !items-center !justify-between !gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#286ee7]">Alege imaginea</p>
                    <h2 className="mt-1 truncate text-base font-bold tracking-[-0.025em] sm:text-lg">{article?.block_title || 'Material'}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {article?.intro && (
                        <Popover>
                            <PopoverHandler>
                                <button type="button" className="ios-secondary-button !min-h-9 !px-3">
                                    <InformationCircleIcon className="h-4 w-4"/><span className="hidden sm:inline">Intro</span>
                                </button>
                            </PopoverHandler>
                            <PopoverContent className="z-[10000] max-w-sm rounded-[20px] border border-white/80 bg-white/75 p-4 text-sm leading-6 text-[#172033] shadow-[0_18px_50px_rgba(40,55,94,0.18)] backdrop-blur-2xl">
                                {article.intro}
                            </PopoverContent>
                        </Popover>
                    )}
                    <button type="button" onClick={handleDialog} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/45 text-[#65728a] shadow-sm transition hover:bg-white/80 hover:text-[#172033]" aria-label="Închide">
                        <XMarkIcon className="h-4 w-4"/>
                    </button>
                </div>
            </DialogHeader>
            <DialogBody className="!min-h-0 !overflow-x-hidden !p-3 sm:!p-5">
                <ImageEditorContent onImageSelected={handleDialog}/>
            </DialogBody>
            <DialogFooter className="!justify-end">
                <button type="button" onClick={handleDialog} className="ios-secondary-button">Închide</button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
