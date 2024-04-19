import {ApiRequest} from "@/API/API";
import {Image} from "@/types";

interface FilesApi {
    upload: (files: FormData) => Promise<Image[]>
}

export const filesApi: FilesApi = {
    upload: (files) => ApiRequest.post('/files', {
        headers:{
            "Content-Type": "multipart/form-data",
        },
        data: files}),
}
