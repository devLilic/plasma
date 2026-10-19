import {Crop, PercentCrop} from "react-image-crop";

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
};

export interface Playlist {
    id: number
    title: string
    can_refresh_parsing?: boolean
    source_type?: 'htm' | 'enps'
}

export type ArticleType = "BETA" | "OFF" | "TEASE" | "METEO" | "CURS" | "LIVE" | "FAKE" | "HEADER" | "INTRO" | "SNC" | "SINCRON" | "AMB" | "TEXT"

export interface ArticleSection {
    slug: string
    type: string
    paragraphs: string[]
}

export type MosFieldRole = 'title' | 'short_title' | 'value'

export interface MosEditableObject {
    type: string
    name: string
    value: string
    role: MosFieldRole
    fieldKey?: string | null
    importedValue?: string
    isOverridden?: boolean
    sourceChanged?: boolean
}

export interface MosObject {
    commandId: string
    slug: string
    playbackState?: 'active' | 'paused' | 'stopped'
    editableObjects: MosEditableObject[]
    objectKey?: string
    memberObjectKeys?: string[]
    revision?: string
    editable?: boolean
}

export interface MosTimelineEntry {
    kind: 'mos' | 'vox'
    position: number | null
    sourceLine: number | null
    count: number | null
    object: MosObject | null
    snippet: string
}

export interface Article {
    id: number
    block_title: string
    title: string
    subtitle: string
    technical_title: string
    slugs: string
    intro: string
    content_sections: ArticleSection[]
    article_type: ArticleType
    article_types: ArticleType[]
    mos_objects?: MosObject[]
    mos_timeline?: MosTimelineEntry[]
    mos_sequence_order?: string[]
    mos_sequence_zones?: Record<string, 'before' | 'after'>
      enps_marker_color?: "yellow" | "red" | "green" | null
    playlist_id: number
    playlist_order: number
    image: Image | null
    current?: boolean
    search_by: "title" | "subtitle"
}

export interface Image {
    id: number
    url: string
    thumbnailUrl: string
    sourceUrl: string | null
    isNew: boolean
    lastUsedAt: string | null
    tags: Tag[]
}

export interface Tag {
    id: number
    title: string
}

export interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

export interface PaginatedResource<T> {
    data: T[]
    links: {
        first: string | null
        last: string | null
        prev: string | null
        next: string | null
    }
    meta: {
        current_page: number
        from: number | null
        last_page: number
        links: PaginationLink[]
        per_page: number
        to: number | null
        total: number
    }
}

export interface ExternalImage {
    id: string
    url: string
    article: string
    site: string
    width: number
    height: number
}

export interface SelectedExternalImage {
    url: string
    readyToCrop: boolean
    cropSection: {
        crop: Crop
        percentCrop: PercentCrop
    },
    croppedUrl: string | null
}

export interface CropExternalImageQuery{
    url: string,
    section: PercentCrop
    article_id: number
}

export interface CropImageWithTagsQuery extends CropExternalImageQuery{
    tags: string
}

export interface SetBackgroundQuery{
    article_id: number,
    image_id: number
}

export interface File{
    lastModified: number
    name: string
    size: number
    type: string
}
