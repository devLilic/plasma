import {ApiRequest} from "@/API/API";
import {Image} from "@/types";

interface ImagesApi {
    fetch: (limit?: number) => Promise<Image[]>
    search: (query: string) => Promise<Image[]>
    delete: (id: number) => Promise<Image>
    addTags: (id: number, tags: string) => Promise<Image>
}

export const imagesApi: ImagesApi = {
    fetch: (limit = 20) => ApiRequest.get('/images', {params: {limit}}),
    search: (query) => ApiRequest.get(`/images/search`, {params: {query}}),
    delete: (id) => ApiRequest.delete(`/images`, {data: {id}}),
    addTags: (id, tags) => ApiRequest.post('/tags', {data: {id, tags}})
}
