import {ReactNode} from 'react';
import {MosObject} from '@/types';

const ArticleMosContent = ({objects = [], compact = false, action}: {objects?: MosObject[]; compact?: boolean; action?: ReactNode}) => {
    const populated = objects.filter(object => object.editableObjects.some(field => field.value.trim() !== ''));
    if (!populated.length) return null;

    return <section className={compact ? 'min-w-0' : 'mx-auto min-w-0 max-w-4xl rounded-[20px] border border-white/75 bg-white/50 p-4 shadow-sm sm:p-5'} aria-label="Elemente MOS">
        {!compact && <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.1em] text-[#7c899d]">Elemente MOS</p>}
        <div className={`grid min-w-0 gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
            {populated.map((object, index) => {
                const fields = object.editableObjects.filter(field => field.value.trim() !== '').sort((left, right) => {
                    const order = {short_title: 0, title: 1, value: 2};
                    return order[left.role] - order[right.role];
                });
                const isTitle = fields.some(field => field.role === 'title' || field.role === 'short_title');
                return <div key={`${object.commandId}-${index}`} className={`min-w-0 rounded-xl border border-[#2878ff]/10 bg-[#edf4ff]/60 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} ${isTitle && !compact ? 'sm:col-span-2' : ''}`}>
                    {object.slug && !compact && <p className="mb-2 text-[10px] font-semibold text-[#286ee7]">{object.slug}</p>}
                    <div className={compact ? 'mos-compact-value-row' : ''}>
                        <div className={compact ? 'min-w-0 flex-1 space-y-1' : 'space-y-1.5'}>
                            {fields.map((field, fieldIndex) => {
                                const fieldName = field.name.toLocaleLowerCase('ro').normalize('NFD').replace(/\p{M}/gu, '');
                                const isFunction = ['functie', 'function'].includes(fieldName);
                                const valueSize = isFunction ? 'text-[12px] leading-[1.45]' : compact ? 'text-[14px] leading-[1.45]' : 'text-[13px] leading-5';
                                return <p key={fieldIndex} data-mos-role={field.role} className={`min-w-0 whitespace-pre-wrap break-words ${valueSize} ${field.role === 'short_title' ? 'text-[#d62f28]' : 'text-[#2c3443]'} ${fieldName === 'nume' || isTitle ? 'font-semibold' : ''}`}>{field.value}</p>;
                            })}
                        </div>
                        {compact && action}
                    </div>
                </div>;
            })}
        </div>
    </section>;
};

export default ArticleMosContent;
