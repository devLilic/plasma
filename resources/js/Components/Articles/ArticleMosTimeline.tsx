import {MosTimelineEntry} from '@/types';
import ArticleMosContent from '@/Components/Articles/ArticleMosContent';

const ArticleMosTimeline = ({entries = []}: {entries?: MosTimelineEntry[]}) => (
    <aside className="min-w-0 rounded-[20px] border border-white/75 bg-white/40 p-4 sm:p-5" aria-label="MOS și VOX în ordinea textului">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">MOS / VOX</p>
        {entries.length ? <ol className="space-y-3">
            {entries.map((entry, index) => <li key={`${entry.position}-${entry.object?.commandId ?? 'vox'}-${index}`} className="min-w-0" data-timeline-kind={entry.kind} data-source-position={entry.position}>
                <p className="mb-1.5 text-[10px] font-semibold text-[#7c899d]">#{index + 1}</p>
                {entry.kind === 'vox' ? <div className="rounded-xl border border-[#c98514]/60 bg-[#fff7e6]/80 px-3 py-3 text-sm font-semibold text-[#936314]">
                    {entry.count === null ? 'VOX-uri' : entry.count === 1 ? '1 VOX' : `${entry.count} VOX-uri`}
                </div> : entry.object && <>
                    <ArticleMosContent objects={[entry.object]} compact/>
                    {entry.snippet ? <p className="mt-2 whitespace-normal break-normal text-sm italic leading-6 text-[#526078]" data-speech-start>„{entry.snippet}…”</p>
                        : entry.position !== null && !entry.object.editableObjects.some(field => field.role === 'title') && <p className="mt-2 text-xs text-[#7c899d]">Începutul intervenției nu este indicat în sursă.</p>}
                </>}
            </li>)}
        </ol> : <p className="text-sm leading-6 text-[#7c899d]">Niciun element MOS sau VOX identificat în text.</p>}
    </aside>
);

export default ArticleMosTimeline;
