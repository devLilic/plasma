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
}

export interface Article {
    id: number
    block_title: string
    title: string
    subtitle: string
    slugs: string
    intro: string
    article_type: "BETA" | "OFF"
    playlist_id: number
    playlist_order: number
    image: Image | null
    current?: boolean
    search_by: "title" | "subtitle"
}

export interface Image {
    id: number
    url: string
    sourceUrl: string
    isNew: boolean
    tags: Tag[]
}

export interface Tag {
    id: number
    title: string
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
