export type OperatorMode = 'preparation' | 'live'

export interface OperatorSelection {
    mode: OperatorMode
    hasEnteredLive: boolean
    currentArticleId: number | null
    previewArticleId: number | null
    mosArticleId: number | null
}

export function selectPlaylistArticle(selection: OperatorSelection, articleId: number): OperatorSelection {
    if (selection.mode === 'live') return {...selection, previewArticleId: articleId}
    return {
        ...selection,
        currentArticleId: articleId,
        ...(!selection.hasEnteredLive ? {previewArticleId: articleId, mosArticleId: articleId} : {}),
    }
}

export function enterLiveMode(selection: OperatorSelection): OperatorSelection {
    if (selection.hasEnteredLive) return {...selection, mode: 'live'}
    const initialId = selection.currentArticleId
    return {
        ...selection,
        mode: 'live',
        hasEnteredLive: true,
        previewArticleId: initialId ?? selection.previewArticleId,
        mosArticleId: initialId ?? selection.mosArticleId,
    }
}

export function leaveLiveMode(selection: OperatorSelection): OperatorSelection {
    return {...selection, mode: 'preparation'}
}
