import {ApiRequest} from "@/API/API";
import {CropExternalImageQuery, ExternalImage, Image, Tag} from "@/types";


interface ExternalImagesApi {
    fetch: (query?: string) => Promise<{images: ExternalImage[], next_page: {}}>,
    crop: (query: CropExternalImageQuery) => Promise<Image>
}

export const externalImagesApi: ExternalImagesApi = {
    fetch: (query) => ApiRequest.get('/resources', {params: {query}}),
    crop: (cropData) => ApiRequest.post('/crop', {data: {url: cropData.url, section: cropData.section}})
}

