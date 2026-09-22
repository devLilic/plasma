import {ApiRequest} from "@/API/API";
import {Image} from "@/types";
import {PercentCrop} from 'react-image-crop';

interface ImagesApi {
    fetch: (query?: {limit?: number, articleId?: number}) => Promise<Image[]>
    search: (query: string, articleId?: number) => Promise<Image[]>
    delete: (id: number) => Promise<Image>
    update: (id: number, tags?: string, section?: PercentCrop) => Promise<Image>
}

export const imagesApi: ImagesApi = {
    fetch: ({limit = 20, articleId} = {}) => ApiRequest.get('/images', {params: {limit, ...(articleId ? {article_id: articleId} : {})}}),
    search: (query, articleId) => ApiRequest.get(`/images/search`, {params: {query, ...(articleId ? {article_id: articleId} : {})}}),
    delete: (id) => ApiRequest.delete(`/images/${id}`),
    update: (id, tags, section) => ApiRequest.patch(`/images/${id}`, {data: {...(tags !== undefined ? {tags} : {}), ...(section ? {section} : {})}})
}
