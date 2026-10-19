import {MosObject, MosTimelineEntry} from '@/types';

export type MosSequenceRow =
    | {kind: 'mos'; key: string; object: MosObject | null; snippet: string; unlocated: boolean; zone: 'before' | 'after'; manuallyPositioned: boolean}
    | {kind: 'vox'; key: string; count: number | null; snippet: string; unlocated: false; zone: 'before' | 'after'; manuallyPositioned: false};

const keyFor = (object: MosObject) => object.objectKey || object.commandId;
const isVoxGraphic = (object: MosObject) => /^(?:\d+[_-])?VOX(?:[_-]|$)/i.test(object.slug || '');
const hasEditableValues = (object: MosObject) => (object.editableObjects || []).some(field => field.value.trim() !== '');
const stableMosKey = (object: MosObject, occurrence: number) => `mos:${encodeURIComponent(keyFor(object))}:${occurrence}`;

export function orderMosSequence(
    entries: MosTimelineEntry[] | null | undefined,
    objects: MosObject[],
    savedOrder: string[] = [],
    savedZones: Record<string, 'before' | 'after'> = {},
): MosSequenceRow[] {
    // Older article payloads have no timeline. Keep their original MOS list usable;
    // an explicitly supplied empty timeline is authoritative.
    if (entries == null) {
        return applySavedOrder(objects.map((object, index) => ({
            kind: 'mos' as const, key: stableMosKey(object, index + 1), object, snippet: '', unlocated: false, zone: 'before' as const, manuallyPositioned: false,
        })), savedOrder, savedZones);
    }
    const currentByObjectKey = new Map(objects.filter(object => object.objectKey).map(object => [object.objectKey!, object]));
    const commandIdCounts = new Map<string, number>();
    objects.forEach(object => commandIdCounts.set(object.commandId, (commandIdCounts.get(object.commandId) || 0) + 1));
    const currentByCommandId = new Map(objects.filter(object => commandIdCounts.get(object.commandId) === 1).map(object => [object.commandId, object]));
    const represented = new Set<string>();
    const occurrences = new Map<string, number>();
    const ordered: MosSequenceRow[] = entries.map((entry, index) => {
        if (entry.kind === 'vox') return {kind: 'vox', key: `vox:${entry.sourceLine ?? entry.position ?? index}`, count: entry.count, snippet: entry.snippet, unlocated: false, zone: 'before', manuallyPositioned: false};
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
        const object = current || source;
        if (!object) return {kind: 'mos', key: `${key}-${index}`, object: null, snippet: entry.snippet, unlocated: entry.position === null, zone: 'after', manuallyPositioned: false};
        const identity = keyFor(object);
        const occurrence = (occurrences.get(identity) || 0) + 1;
        occurrences.set(identity, occurrence);
        return {kind: 'mos', key: stableMosKey(object, occurrence), object, snippet: entry.snippet, unlocated: entry.position === null, zone: entry.position === null ? 'after' : 'before', manuallyPositioned: false};
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
    }).forEach(object => {
        const identity = keyFor(object);
        const occurrence = (occurrences.get(identity) || 0) + 1;
        occurrences.set(identity, occurrence);
        ordered.push({kind: 'mos', key: stableMosKey(object, occurrence), object, snippet: '', unlocated: true, zone: 'after', manuallyPositioned: false});
    });
    return applySavedOrder(ordered, savedOrder, savedZones);
}

function applySavedOrder(rows: MosSequenceRow[], savedOrder: string[], savedZones: Record<string, 'before' | 'after'>): MosSequenceRow[] {
    const byKey = new Map(rows.map(row => [row.key, row]));
    const ordered: MosSequenceRow[] = [];
    const seen = new Set<string>();
    for (const key of savedOrder) {
        const row = byKey.get(key);
        if (!row || seen.has(key)) continue;
        ordered.push(row);
        seen.add(key);
    }
    for (const row of rows) if (!seen.has(row.key)) ordered.push(row);

    return ordered.map(row => {
        const zone = savedZones[row.key] || (row.kind === 'mos' && row.unlocated ? 'after' : 'before');
        return row.kind === 'mos'
            ? {...row, zone, manuallyPositioned: Object.hasOwn(savedZones, row.key)}
            : {...row, zone, manuallyPositioned: false};
    });
}

export function moveMosSequenceRow(
    rows: MosSequenceRow[],
    sourceKey: string,
    targetKey: string | null,
    targetZone: 'before' | 'after',
    afterTarget = false,
): MosSequenceRow[] {
    if (sourceKey === targetKey) return rows;
    const source = rows.find(row => row.key === sourceKey);
    if (!source || source.kind !== 'mos') return rows;
    const remaining = rows.filter(row => row.key !== sourceKey);
    const targetIndex = targetKey === null ? remaining.findIndex(row => row.zone === targetZone) : remaining.findIndex(row => row.key === targetKey);
    let insertAt = targetIndex < 0 ? remaining.length : targetIndex + (afterTarget ? 1 : 0);
    if (targetKey === null) {
        if (targetZone === 'after') {
            const firstAfter = remaining.findIndex(row => row.zone === 'after');
            insertAt = firstAfter < 0 ? remaining.length : firstAfter;
        } else {
            const lastBefore = remaining.reduce((last, row, index) => row.zone === 'before' ? index : last, -1);
            insertAt = lastBefore + 1;
        }
    }
    const nextSource = {...source, zone: targetZone, manuallyPositioned: source.manuallyPositioned || source.zone !== targetZone};
    remaining.splice(insertAt, 0, nextSource);
    return remaining;
}
