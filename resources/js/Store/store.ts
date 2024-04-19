import {configureStore} from "@reduxjs/toolkit";
import {articlesReducer} from "@/Store/article/article.slice";
import {imagesReducer} from "@/Store/image/image.slice";
import {externalImagesReducer} from "@/Store/image/externalImage.slice";
import {filesReducer} from "@/Store/files.slice";

export const store = configureStore({
    reducer: {
        articles: articlesReducer,
        images: imagesReducer,
        externalImages: externalImagesReducer,
        files: filesReducer
    },
    // middleware: getDefaultMiddleware =>
    //     getDefaultMiddleware().concat(imageApi.middleware)
})

export type TypeRootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
