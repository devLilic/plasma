import {configureStore} from "@reduxjs/toolkit";
import {articlesReducer} from "@/Store/article/article.slice";
import {imagesReducer} from "@/Store/image/image.slice";

export const store = configureStore({
    reducer: {
        articles: articlesReducer,
        images: imagesReducer,
    },
    // middleware: getDefaultMiddleware =>
    //     getDefaultMiddleware().concat(imageApi.middleware)
})

export type TypeRootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
