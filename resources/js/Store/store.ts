import {configureStore} from "@reduxjs/toolkit";
import {imageApi} from "@/Store/image/image.api";
import {articleReducer} from "@/Store/article/article.slice";

export const store = configureStore({
    reducer: {
        [imageApi.reducerPath]: imageApi.reducer,
        article: articleReducer
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(imageApi.middleware)
})

export type TypeRootState = ReturnType<typeof store.getState>
