import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {Article} from "@/types";


interface InitialState {
    articles: Article[]
    currentArticle: Article | null
}

const initialState: InitialState = {
    articles: [],
    currentArticle: null
}


export const articleSlice = createSlice({
    name: "article",
    initialState,
    reducers: {
        setCurrent: (state, action: PayloadAction<Article>) => {
            state.currentArticle = action.payload
        },
        addArticle: (state, action) => {
        }
    }
})

export const articleReducer = articleSlice.reducer
export const articleActions = articleSlice.actions
