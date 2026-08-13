import React from 'react';
import {Tag} from '@/types';

interface TagListProps {
    tags: Tag[];
}

export default function TagsList({tags}: TagListProps) {
    return <>{tags.map(tag => (
        <span key={tag.id} className="ios-tag-chip" title={`Etichetă: ${tag.title}`}>
            <span className="truncate">{tag.title}</span>
        </span>
    ))}</>;
}
