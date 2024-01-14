import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {Image} from "@/types";

export const imageApi = createApi({
    reducerPath: "api/images",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://plasma.test/api"
    }),
    endpoints: build => ({
        getImages: build.query<Image[], number>({
            query: (limit = 5) => "/images"
        })
    })
})

export const {useGetImagesQuery} = imageApi
