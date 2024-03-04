import {createAsyncThunk, createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Article, Image, SetBackgroundQuery} from "@/types";
import {TypeRootState} from "@/Store/store";
import {useSelector} from "react-redux";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {articlesApi, NewArticleQuery} from "@/API/articles.api";

const articlesAdapter = createEntityAdapter<Article>({
    sortComparer: (a, b) => a.playlist_order - b.playlist_order
})

interface ArticlesState {
    current: number,
    status: "idle" | "pending" | "succeeded" | "failed"
    error: string | null
    search_by: "title" | "subtitle" | null
    article_new: NewArticleQuery
    playlist_id: number | null
    delete_id: number | null
}

const initialState = articlesAdapter.getInitialState<ArticlesState>({
    current: 0,
    status: "idle",
    error: null,
    search_by: null,
    article_new: {
        title: '',
        position: 0,
        articleType: "BETA",
        playlist_id: null
    },
    playlist_id: null,
    delete_id: null
})

export const articlesSlice = createSlice({
    name: "articles",
    initialState,
    reducers: {
        setArticles: (state, action: PayloadAction<Article[]>) => {
            articlesAdapter.setAll(state, action.payload)
        },
        setPlaylist: (state, action: PayloadAction<number>) => {
            state.playlist_id = action.payload
        },
        changeSearchBy: articlesAdapter.updateOne,
        changeTitle: articlesAdapter.updateOne,
        changeSubtitle: articlesAdapter.updateOne,
        setCurrent: (state, action: PayloadAction<{ id: number }>) => {
            state.current = action.payload.id
        },
        setBackgroundImage: (state, action: PayloadAction<Image>) => {
            articlesAdapter.updateOne(state, {id: state.current, changes: {image: action.payload}})
        },
        removeBackground: articlesAdapter.updateOne,
        changeNewArticleTitle: (state, action: PayloadAction<string>) => {
            state.article_new.title = action.payload
        },
        changeNewArticlePosition: (state, action: PayloadAction<number>) => {
            state.article_new.position = action.payload
        },
        changeNewArticleType: (state, action: PayloadAction<"BETA" | "OFF" | "LIVE">) => {
            state.article_new.articleType = action.payload
        },
        resetNewArticle: (state) => {
            state.article_new = {
                title: '',
                position: 0,
                articleType: "BETA",
                playlist_id: null
            }
        },
        markForDelete: (state, action: PayloadAction<number>) => {
            state.delete_id = action.payload
        },
        unmarkForDelete: (state) => {
            state.delete_id = null
        }
    },
    extraReducers: builder =>
        builder
            .addCase(setBackgroundImage.fulfilled, articlesAdapter.upsertOne)
            .addCase(removeBackgroundImage.fulfilled, articlesAdapter.upsertOne)
            .addCase(addNewArticle.fulfilled, articlesAdapter.setAll)
            .addCase(deleteArticle.fulfilled, articlesAdapter.removeOne)
})


export const {
    selectAll: selectAllArticles,
    selectById: selectArticleById,
    selectIds: selectArticlesIds
} = articlesAdapter.getSelectors<TypeRootState>(state => state.articles)

export const articlesReducer = articlesSlice.reducer
export const articlesActions = articlesSlice.actions

export const setBackgroundImage = createAsyncThunk(
    'articles/setBackgroundImage',
    async (query: SetBackgroundQuery, {rejectWithValue}) => {
        try {
            return await articlesApi.setBackground(query)
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const removeBackgroundImage = createAsyncThunk(
    'articles/removeBackgroundImage',
    async (query: { article_id: number }, {rejectWithValue}) => {
        try {
            return await articlesApi.removeBackground(query)
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)


export const addNewArticle = createAsyncThunk(
    'articles/addNewArticle',
    async (query: NewArticleQuery, {rejectWithValue}) => {
        try {
            return await articlesApi.addArticle(query)
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const deleteArticle = createAsyncThunk(
    'articles/deleteArticle',
    async (query: { id: number }, {rejectWithValue}) => {
        try {
            await articlesApi.removeArticle(query)
            return query.id
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)
