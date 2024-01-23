import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Article} from "@/types";
import {TypeRootState} from "@/Store/store";
import {useSelector} from "react-redux";

const articlesAdapter = createEntityAdapter<Article>()

interface ArticlesState {
    current: number,
    status: "idle" | "pending" | "succeeded" | "failed"
    error: string | null
}

const initialState = articlesAdapter.getInitialState<ArticlesState>({
    current: 0,
    status: "idle",
    error: null
})

export const articlesSlice = createSlice({
    name: "articles",
    initialState,
    reducers: {
        setArticles: (state, action: PayloadAction<Article[]>) => {
            articlesAdapter.setAll(state, action.payload)
        },
        setCurrent: (state, action: PayloadAction<{ id: number }>) => {
            state.current = action.payload.id
        },
        setBackgroundImage: articlesAdapter.updateOne,
        removeBackground: articlesAdapter.updateOne
        // removeBackground: (state, action: PayloadAction<{ articleId: number }>) => {
        //     state.articles.map(article => {
        //         if (article.id === action.payload.articleId) {
        //             article.image = null
        //         }
        //     })
        // },
        // addArticle: (state, action) => {
        // }
    },
    // extraReducers: builder => {
    //     builder
    //         .addCase(fetchArticlesByPlaylistId.fulfilled, (state, action) => {
    //             state.status = 'succeeded'
    //             articlesAdapter.upsertMany
    //         })
    // }
})


export const {
    selectAll: selectAllArticles,
    selectById: selectArticleById,
    selectIds: selectArticlesIds
} = articlesAdapter.getSelectors<TypeRootState>(state => state.articles)

export const articlesReducer = articlesSlice.reducer
export const articlesActions = articlesSlice.actions
