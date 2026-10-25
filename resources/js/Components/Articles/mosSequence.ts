import {MosObject, MosTimelineEntry} from '@/types';

export type MosSequenceRow =
    | {kind: 'mos'; key: string; object: MosObject | null; snippet: string}
    | {kind: 'vox'; key: string; count: number | null; snippet: string};

const keyFor = (object: MosObject) => object.objectKey || object.commandId;

export function orderMosSequence(entries: MosTimelineEntry[], objects: MosObject[]): MosSequenceRow[] {
    if (!entries.length) return objects.map((object, index) => ({kind: 'mos', key: `${keyFor(object)}-${index}`, object, snippet: ''}));
    const currentByKey = new Map(objects.filter(object => object.objectKey).map(object => [object.objectKey!, object]));
    const represented = new Set<string>();
    const ordered: MosSequenceRow[] = entries.map((entry, index) => {
        if (entry.kind === 'vox') return {kind: 'vox', key: `vox-${entry.position ?? index}-${index}`, count: entry.count, snippet: entry.snippet};
        const source = entry.object;
        const key = source ? keyFor(source) : `mos-${entry.position ?? index}-${index}`;
        if (source?.objectKey) represented.add(source.objectKey);
        return {kind: 'mos', key: `${key}-${index}`, object: source?.objectKey ? currentByKey.get(source.objectKey) || source : source, snippet: entry.snippet};
    });
    objects.filter(object => !object.objectKey || !represented.has(object.objectKey)).forEach((object, index) => ordered.push({kind: 'mos', key: `unplaced-${keyFor(object)}-${index}`, object, snippet: ''}));
    return ordered;
}
