import React, {ChangeEvent} from 'react';
import {DocumentPlusIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {useTypedSelector} from '@/Hooks/useTypedSelector';
import {useActions} from '@/Hooks/useActions';
import Dialog from '@/Components/Material/Dialog';
import DialogHeader from '@/Components/Material/DialogHeader';
import DialogBody from '@/Components/Material/DialogBody';
import DialogFooter from '@/Components/Material/DialogFooter';

interface NewArticleDialogProps {
    isOpen: boolean
    handleDialog: () => void
}

const NewArticleDialog = ({isOpen, handleDialog}: NewArticleDialogProps) => {
    const title = useTypedSelector(state => state.articles.article_new.title);
    const type = useTypedSelector(state => state.articles.article_new.articleType);
    const playlistId = useTypedSelector(state => state.articles.playlist_id);
    const position = useTypedSelector(state => state.articles.article_new.position);
    const {changeNewArticleTitle, changeNewArticleType, resetNewArticle, addNewArticle} = useActions();

    const close = () => {
        resetNewArticle();
        handleDialog();
    };

    const save = () => {
        if (!title.trim()) return;
        addNewArticle({title, articleType: type, position, playlist_id: playlistId});
        close();
    };

    return (
        <Dialog size="xs" open={isOpen} handler={close}>
            <DialogHeader className="!flex !items-center !justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#007aff]/10 text-[#007aff]">
                        <DocumentPlusIcon className="h-5 w-5"/>
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-[-0.02em]">Material nou</h2>
                        <p className="mt-0.5 text-xs font-normal text-[#8e8e93]">Poziția {position} în playlist</p>
                    </div>
                </div>
                <button type="button" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f7] text-[#8e8e93] hover:bg-[#e5e5ea]" aria-label="Închide">
                    <XMarkIcon className="h-4 w-4"/>
                </button>
            </DialogHeader>
            <DialogBody>
                <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">Titlu</span>
                    <input autoFocus required value={title}
                           onChange={(event: ChangeEvent<HTMLInputElement>) => changeNewArticleTitle(event.target.value.toUpperCase())}
                           onKeyDown={event => event.key === 'Enter' && save()}
                           placeholder="Scrie titlul materialului"
                           className="h-12 w-full rounded-xl border-0 bg-[#f2f2f7] px-4 text-sm font-medium text-[#1c1c1e] outline-none ring-0 placeholder:text-[#8e8e93] focus:bg-white focus:ring-2 focus:ring-[#007aff]/25"/>
                </label>

                <fieldset className="mt-5">
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">Tip material</legend>
                    <div className="grid grid-cols-3 gap-1 rounded-[14px] bg-[#f2f2f7] p-1">
                        {(['BETA', 'OFF', 'LIVE'] as const).map(option => (
                            <button key={option} type="button" onClick={() => changeNewArticleType(option)}
                                    className={`rounded-[10px] px-3 py-2.5 text-xs font-semibold transition ${type === option ? 'bg-white text-[#007aff] shadow-sm' : 'text-[#6e6e73] hover:text-[#1c1c1e]'}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                </fieldset>
            </DialogBody>
            <DialogFooter className="!grid !grid-cols-2">
                <button type="button" onClick={close} className="ios-secondary-button !bg-white">Renunță</button>
                <button type="button" onClick={save} disabled={!title.trim()} className="ios-primary-button disabled:cursor-not-allowed disabled:opacity-40">Adaugă</button>
            </DialogFooter>
        </Dialog>
    );
};

export default NewArticleDialog;
