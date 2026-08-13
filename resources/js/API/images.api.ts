import {ApiRequest} from "@/API/API";
import {Image} from "@/types";
import {PercentCrop} from 'react-image-crop';

interface ImagesApi {
    fetch: (limit?: number) => Promise<Image[]>
    search: (query: string) => Promise<Image[]>
    delete: (id: number) => Promise<Image>
    update: (id: number, tags?: string, section?: PercentCrop) => Promise<Image>
}

export const imagesApi: ImagesApi = {
    fetch: (limit = 20) => ApiRequest.get('/images', {params: {limit}}),
    search: (query) => ApiRequest.get(`/images/search`, {params: {query}}),
    delete: (id) => ApiRequest.delete(`/images/${id}`),
    update: (id, tags, section) => ApiRequest.patch(`/images/${id}`, {data: {...(tags !== undefined ? {tags} : {}), ...(section ? {section} : {})}})
}
