import React from 'react';
import {Tag} from "@/types";

interface TagListProps {
    tags: Tag[]
}

const TagsList = ({tags}: TagListProps) => {
    return (<>
        {tags.map(tag => (
            <span key={tag.id} className='px-2 text-xs text-gray-800
                                   bg-yellow-100 mx-1
                                   border border-yellow-500 rounded'>
                {tag.title}
            </span>))}
    </>);
};

export default TagsList;
