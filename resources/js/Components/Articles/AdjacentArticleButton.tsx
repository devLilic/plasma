import {ChevronLeftIcon, ChevronRightIcon, PhotoIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import ImageWithLoader from '@/Components/UI/ImageWithLoader';

interface AdjacentArticleButtonProps {
    article: Article | null
    direction: 'previous' | 'next'
    disabled: boolean
    onClick: () => void
}

export default function AdjacentArticleButton({article, direction, disabled, onClick}: AdjacentArticleButtonProps) {
    const title = article?.subtitle || article?.title || article?.technical_title || '';
    return <button type="button" className={`live-adjacent-article ${direction}`} disabled={disabled || !article} onClick={onClick} aria-label={`${direction === 'previous' ? 'Articol precedent' : 'Articol următor'}${title ? `: ${title}` : ''}`}>
        {direction === 'previous' && <ChevronLeftIcon className="live-adjacent-arrow" aria-hidden="true"/>}
        {direction === 'previous' && <AdjacentThumbnail article={article}/>}
        <span className="live-adjacent-copy"><small>{direction === 'previous' ? 'PREV' : 'NEXT'}</small><strong>{article ? `#${article.playlist_order} ${title}` : direction === 'previous' ? 'Primul articol' : 'Ultimul articol'}</strong></span>
        {direction === 'next' && <AdjacentThumbnail article={article}/>}
        {direction === 'next' && <ChevronRightIcon className="live-adjacent-arrow" aria-hidden="true"/>}
    </button>;
}

function AdjacentThumbnail({article}: {article: Article | null}) {
    return <span className="live-adjacent-thumbnail">{article?.image ? <ImageWithLoader src={article.image.thumbnailUrl} alt="" containerClassName="h-full w-full overflow-hidden rounded-lg bg-[#e9edf5]" className="h-full w-full object-cover" loading="lazy" decoding="async"/> : <PhotoIcon className="h-5 w-5" aria-hidden="true"/>}</span>;
}
