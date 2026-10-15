import {MosObject, MosTimelineEntry} from '@/types';

export type MosSequenceRow =
    | {kind: 'mos'; key: string; object: MosObject | null; snippet: string}
    | {kind: 'vox'; key: string; count: number | null; snippet: string};

const keyFor = (object: MosObject) => object.objectKey || object.commandId;
const isVoxGraphic = (object: MosObject) => /^(?:\d+[_-])?VOX(?:[_-]|$)/i.test(object.slug || '');
const hasEditableValues = (object: MosObject) => (object.editableObjects || []).some(field => field.value.trim() !== '');

export function orderMosSequence(entries: MosTimelineEntry[] | null | undefined, objects: MosObject[]): MosSequenceRow[] {
    // Older article payloads have no timeline. Keep their original MOS list usable;
    // an explicitly supplied empty timeline is authoritative.
    if (entries == null) return objects.map((object, index) => ({kind: 'mos', key: `${keyFor(object)}-${index}`, object, snippet: ''}));
    const currentByObjectKey = new Map(objects.filter(object => object.objectKey).map(object => [object.objectKey!, object]));
    const commandIdCounts = new Map<string, number>();
    objects.forEach(object => commandIdCounts.set(object.commandId, (commandIdCounts.get(object.commandId) || 0) + 1));
    const currentByCommandId = new Map(objects.filter(object => commandIdCounts.get(object.commandId) === 1).map(object => [object.commandId, object]));
    const represented = new Set<string>();
    const ordered: MosSequenceRow[] = entries.map((entry, index) => {
        if (entry.kind === 'vox') return {kind: 'vox', key: `vox-${entry.position ?? index}-${index}`, count: entry.count, snippet: entry.snippet};
        const source = entry.object;
        const key = source ? keyFor(source) : `mos-${entry.position ?? index}-${index}`;
        if (source) {
            represented.add(keyFor(source));
            if (source.objectKey) represented.add(source.objectKey);
            source.memberObjectKeys?.forEach(memberKey => represented.add(memberKey));
        }
        const current = source?.objectKey
            ? currentByObjectKey.get(source.objectKey)
            : source ? currentByCommandId.get(source.commandId) : undefined;
        return {kind: 'mos', key: `${key}-${index}`, object: current || source, snippet: entry.snippet};
    });
    const appended = new Set<string>();
    objects.filter(object => {
        // The backend timeline is authoritative for valued graphics, including
        // unique graphics with no text match. Only empty templates need supplementing.
        if (hasEditableValues(object) || isVoxGraphic(object)) return false;
        const identities = [keyFor(object), ...(object.objectKey ? [object.objectKey] : []), ...(object.memberObjectKeys || [])];
        if (identities.some(identity => represented.has(identity) || appended.has(identity))) return false;
        identities.forEach(identity => appended.add(identity));
        return true;
    }).forEach((object, index) => ordered.push({kind: 'mos', key: `unplaced-${keyFor(object)}-${index}`, object, snippet: ''}));
    return ordered;
}
