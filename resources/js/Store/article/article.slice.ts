import {createAsyncThunk, createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Article, Image, SetBackgroundQuery} from "@/types";
import {TypeRootState} from "@/Store/store";
import {useSelector} from "react-redux";
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {articlesApi, NewArticleQuery} from "@/API/articles.api";

const articlesAdapter = createEntityAdapter<Article>()

interface ArticlesState {
    current: number,
    status: "idle" | "pending" | "succeeded" | "failed"
    error: string | null
    search_by: "title" | "subtitle" | null
}

const initialState = articlesAdapter.getInitialState<ArticlesState>({
    current: 0,
    status: "idle",
    error: null,
    search_by: null
})

export const articlesSlice = createSlice({
    name: "articles",
    initialState,
    reducers: {
        setArticles: (state, action: PayloadAction<Article[]>) => {
            articlesAdapter.setAll(state, action.payload)
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
        removeBackground: articlesAdapter.updateOne
    },
    extraReducers: builder =>
        builder
            .addCase(setBackgroundImage.fulfilled, articlesAdapter.upsertOne)
            .addCase(removeBackgroundImage.fulfilled, articlesAdapter.upsertOne)
            .addCase(addNewArticle.fulfilled, articlesAdapter.upsertOne)
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
            return articlesApi.removeBackground(query)
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)


export const addNewArticle = createAsyncThunk(
    'articles/addNewArticle',
    async (query: NewArticleQuery, {rejectWithValue}) => {
        try {
            return articlesApi.addArticle(query)
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)
