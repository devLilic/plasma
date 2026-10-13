import {useState} from 'react';
import {DocumentTextIcon} from '@heroicons/react/24/outline';
import {useDispatch} from 'react-redux';
import {createPortal} from 'react-dom';
import {Article} from '@/types';
import {AppDispatch} from '@/Store/store';
import {updateTextHighlight} from '@/Store/article/article.slice';
import ArticleMosTimeline from '@/Components/Articles/ArticleMosTimeline';
import {normalizeEditorialText} from '@/Utils/editorialText';

const highlightStyle = 'font-weight: 800; background-color: #ffcc0073; padding: 0 2px; border-radius: 2px;';

interface TextSelection {
    paragraph: HTMLParagraphElement
    sectionIndex: number
    paragraphIndex: number
    highlightedElement: HTMLElement | null
    menuPosition: {top: number; left: number}
}

const ArticleTextContent = ({article, showMosTimeline = true}: {article: Article; showMosTimeline?: boolean}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [selection, setSelection] = useState<TextSelection | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const captureSelection = () => {
        const browserSelection = window.getSelection();
        if (!browserSelection?.rangeCount || browserSelection.isCollapsed) return setSelection(null);

        const range = browserSelection.getRangeAt(0);
        const startParagraph = parentParagraph(range.startContainer);
        const endParagraph = parentParagraph(range.endContainer);
        if (!startParagraph || startParagraph !== endParagraph) return setSelection(null);

        const sectionIndex = Number(startParagraph.dataset.sectionIndex);
        const paragraphIndex = Number(startParagraph.dataset.paragraphIndex);
        if (!Number.isInteger(sectionIndex) || !Number.isInteger(paragraphIndex)) return setSelection(null);

        const highlightedElement = highlightedParent(range.startContainer);
        const selectionStaysInHighlight = highlightedElement && highlightedElement.contains(range.endContainer);
        const overlapsHighlight = [...startParagraph.querySelectorAll<HTMLElement>('[data-onair-highlight]')].some(item => range.intersectsNode(item));
        const selectionRect = range.getBoundingClientRect();
        const menuHalfWidth = Math.min(112, window.innerWidth / 2 - 8);
        setSelection({
            paragraph: startParagraph,
            sectionIndex,
            paragraphIndex,
            highlightedElement: selectionStaysInHighlight ? highlightedElement : overlapsHighlight ? null : null,
            menuPosition: {
                top: Math.min(window.innerHeight - 44, selectionRect.bottom + 8),
                left: Math.min(window.innerWidth - menuHalfWidth - 8, Math.max(menuHalfWidth + 8, selectionRect.left + selectionRect.width / 2)),
            },
        });
    };

    const persist = async (selected: TextSelection, previousHtml: string) => {
        setSaving(true);
        setError(null);
        try {
            await dispatch(updateTextHighlight({articleId: article.id, sectionIndex: selected.sectionIndex, paragraphIndex: selected.paragraphIndex, html: selected.paragraph.innerHTML})).unwrap();
            window.getSelection()?.removeAllRanges();
            setSelection(null);
        } catch {
            selected.paragraph.innerHTML = previousHtml;
            setError('Evidențierea nu a putut fi salvată.');
        } finally {
            setSaving(false);
        }
    };

    const addHighlight = () => {
        if (!selection) return;
        const browserSelection = window.getSelection();
        if (!browserSelection?.rangeCount) return;
        const range = browserSelection.getRangeAt(0);
        const previousHtml = selection.paragraph.innerHTML;
        const marker = document.createElement('strong');
        marker.dataset.onairHighlight = 'true';
        marker.setAttribute('style', highlightStyle);
        try {
            range.surroundContents(marker);
        } catch {
            setError('Selectează un fragment care nu include o evidențiere existentă.');
            return;
        }
        void persist(selection, previousHtml);
    };

    const removeHighlight = () => {
        if (!selection?.highlightedElement) return;
        const previousHtml = selection.paragraph.innerHTML;
        selection.highlightedElement.replaceWith(document.createTextNode(selection.highlightedElement.textContent ?? ''));
        void persist(selection, previousHtml);
    };

    return <div className="mx-auto min-w-0 max-w-6xl space-y-4" onMouseUp={captureSelection} onKeyUp={captureSelection}>
        {selection && createPortal(<div className="fixed z-[110] -translate-x-1/2 rounded-xl border border-[#286ee7]/15 bg-[#eaf3ff]/95 p-1.5 shadow-lg backdrop-blur" style={selection.menuPosition} role="toolbar" aria-label="Acțiuni pentru textul selectat">
            {selection.highlightedElement ? (
                <button type="button" disabled={saving} onMouseDown={event => event.preventDefault()} onClick={removeHighlight} className="inline-flex min-h-8 items-center rounded-lg bg-[#65728a] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#526078] disabled:opacity-50">{saving ? 'Se salvează…' : 'Elimină evidențierea'}</button>
            ) : (
                <button type="button" disabled={saving} onMouseDown={event => event.preventDefault()} onClick={addHighlight} className="inline-flex min-h-8 items-center rounded-lg bg-[#286ee7] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#1e5cc7] disabled:opacity-50">{saving ? 'Se salvează…' : 'Evidențiază selecția'}</button>
            )}
        </div>, document.body)}
        {error && <p role="alert" className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-sm font-medium text-[#c9251c]">{error}</p>}
        <div className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" data-text-mos-columns>
        <div className="min-w-0 space-y-4" data-script-text>
        {article.content_sections.length ? article.content_sections.map((section, sectionIndex) => (
            <div key={`${section.slug}-${sectionIndex}`} className="space-y-4">
                <article className="min-w-0 max-w-full overflow-hidden rounded-[20px] border border-white/75 bg-white/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.85)] sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#71809a]/10 pb-3">
                        <span className="rounded-lg bg-[#172033]/[0.06] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-[#526078]">{section.type}</span>
                    </div>
                    {section.paragraphs.length ? (
                        <div className="min-w-0 max-w-full space-y-3 overflow-hidden text-[15px] leading-7 text-[#2c3443]">
                            {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} data-section-index={sectionIndex} data-paragraph-index={paragraphIndex} className="whitespace-normal break-normal [hyphens:none]" dangerouslySetInnerHTML={{__html: displayHtml(paragraph)}}/>) }
                        </div>
                    ) : <p className="text-sm italic text-[#9aa8bc]">Secțiune fără text.</p>}
                </article>
            </div>
        )) : (
            <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#9aa8bc]/35 bg-white/25 px-6 text-center">
                <DocumentTextIcon className="mb-3 h-10 w-10 text-[#9aa8bc]"/>
                <p className="font-semibold text-[#172033]">Nu există text structurat</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-[#65728a]">Acest material provine dintr-un playlist vechi sau a fost adăugat manual.</p>
            </div>
        )}
        </div>
        {showMosTimeline && <ArticleMosTimeline entries={article.mos_timeline}/>}
        </div>
    </div>;
};

export default ArticleTextContent;

function parentParagraph(node: Node): HTMLParagraphElement | null {
    const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
    return element?.closest<HTMLParagraphElement>('p[data-section-index]') ?? null;
}

function highlightedParent(node: Node): HTMLElement | null {
    const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
    return element?.closest<HTMLElement>('[data-onair-highlight]') ?? null;
}

function displayHtml(paragraph: string): string {
    paragraph = normalizeEditorialText(paragraph);
    if (paragraph.includes('data-onair-highlight')) {
        return paragraph.replace(/&nbsp;|&#(?:160|x0*a0);/gi, ' ');
    }
    return paragraph.replace(/[&<>'"]/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'}[character] ?? character));
}
