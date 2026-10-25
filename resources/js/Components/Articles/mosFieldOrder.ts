import type {MosEditableObject} from '@/types';

const normalizeFieldName = (name: string) => name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLocaleLowerCase('ro')
    .replace(/[\s_-]/g, '');

export function compareMosFieldOrder(left: MosEditableObject, right: MosEditableObject) {
    const order = (field: MosEditableObject) => {
        const name = normalizeFieldName(field.name);
        if (name === 'supratitlu' || name === 'supertitlu') return -1;
        if (field.role === 'short_title') return 0;
        if (field.role === 'title') return 1;
        return 2;
    };

    return order(left) - order(right);
}
