import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {Article, Image} from "@/types";


interface InitialState {
    articles: Article[]
}

const initialState: InitialState = {
    articles: [],
}


export const articleSlice = createSlice({
    name: "article",
    initialState,
    reducers: {
        setArticles: (state, action: PayloadAction<Article[]>) => {
            state.articles = action.payload
        },
        setCurrent: (state, action: PayloadAction<{ id: number }>) => {
            state.articles.map(article => {
                article.current = article.id === action.payload.id;
            })
        },
        setBackgroundImage: (state, action: PayloadAction<{ image: Image }>) => {
            state.articles.map(article => {
                if (article.current) {
                    article.image = action.payload.image
                }
            })
        },
        removeBackground: (state, action: PayloadAction<{articleId: number}>) => {
            state.articles.map(article => {
                if (article.id === action.payload.articleId) {
                    article.image = null
                }
            })
        },
        addArticle: (state, action) => {
        }
    }
})

export const articleReducer = articleSlice.reducer
export const articleActions = articleSlice.actions
