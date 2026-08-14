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
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-[#2878ff]/10 text-[#286ee7] shadow-sm">
                        <DocumentPlusIcon className="h-5 w-5"/>
                    </span>
                    <div>
                        <h2 className="text-lg font-bold tracking-[-0.025em]">Material nou</h2>
                        <p className="mt-0.5 text-xs font-normal text-[#65728a]">Poziția {position} în playlist</p>
                    </div>
                </div>
                <button type="button" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/45 text-[#65728a] hover:bg-white/80" aria-label="Închide">
                    <XMarkIcon className="h-4 w-4"/>
                </button>
            </DialogHeader>
            <DialogBody>
                <label className="block">
                    <span className="auth-field-label">Titlu</span>
                    <input autoFocus required value={title}
                           onChange={(event: ChangeEvent<HTMLInputElement>) => changeNewArticleTitle(event.target.value.toUpperCase())}
                           onKeyDown={event => event.key === 'Enter' && save()}
                           placeholder="Scrie titlul materialului"
                           className="ios-search !h-12 !pl-4"/>
                </label>

                <fieldset className="mt-5">
                    <legend className="auth-field-label">Tip material</legend>
                    <div className="grid grid-cols-3 gap-1 rounded-[16px] border border-white/60 bg-white/30 p-1">
                        {(['BETA', 'OFF', 'LIVE'] as const).map(option => (
                            <button key={option} type="button" onClick={() => changeNewArticleType(option)}
                                    className={`rounded-[12px] px-3 py-2.5 text-xs font-semibold transition ${type === option ? 'bg-white/90 text-[#286ee7] shadow-sm ring-1 ring-white' : 'text-[#65728a] hover:bg-white/35 hover:text-[#172033]'}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                </fieldset>
            </DialogBody>
            <DialogFooter className="!grid !grid-cols-2">
                <button type="button" onClick={close} className="ios-secondary-button">Renunță</button>
                <button type="button" onClick={save} disabled={!title.trim()} className="ios-primary-button disabled:cursor-not-allowed disabled:opacity-40">Adaugă</button>
            </DialogFooter>
        </Dialog>
    );
};

export default NewArticleDialog;
