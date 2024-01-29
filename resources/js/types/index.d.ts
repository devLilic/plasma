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
    title: string
    subtitle: string
    slugs: string
    intro: string
    article_type: "BETA" | "OFF"
    playlist_id: number
    playlist_order: number
    image: Image | null
    current?: boolean
}

export interface Image {
    id: number
    url: string
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
