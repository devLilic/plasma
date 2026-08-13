import {ApiRequest} from "@/API/API";
import {CropImageWithTagsQuery, Image} from "@/types";


interface ExternalImagesApi {
    crop: (query: CropImageWithTagsQuery) => Promise<Image>
}

export const externalImagesApi: ExternalImagesApi = {
    crop: (cropData) => ApiRequest.post('/crop', {data: cropData})
}
