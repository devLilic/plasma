import React from 'react';
import {Tag} from '@/types';

interface TagListProps {
    tags: Tag[];
    maxVisible?: number;
}

export default function TagsList({tags, maxVisible = 3}: TagListProps) {
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenTags = tags.length - visibleTags.length;

    return <>{visibleTags.map(tag => (
        <span key={tag.id} className="ios-tag-chip" title={`Etichetă: ${tag.title}`}>
            <span className="block min-w-0 max-w-full truncate">{tag.title}</span>
        </span>
    ))}
        {hiddenTags > 0 && (
            <span className="ios-tag-chip shrink-0" title={`Încă ${hiddenTags} ${hiddenTags === 1 ? 'etichetă' : 'etichete'}`} aria-label={`Încă ${hiddenTags} ${hiddenTags === 1 ? 'etichetă' : 'etichete'}`}>
                (…)
            </span>
        )}
    </>;
}
