import {ApiRequest} from "@/API/API";
import {Article, Image, SetBackgroundQuery} from "@/types";

export interface NewArticleQuery {
    title: string
    articleType: "BETA" | "OFF" | "LIVE"
    position: number
    playlist_id: number | null
}

interface ArticlesApi {
    setBackground: (query: SetBackgroundQuery) => Promise<Article>
    removeBackground: (query: { article_id: number }) => Promise<Article>
    addArticle: (query: NewArticleQuery) => Promise<Article[]>
    removeArticle: (query: {id: number}) => Promise<any>
}

export const articlesApi: ArticlesApi = {
    setBackground: (query) => ApiRequest.patch('/article', {data: {query}}),
    removeBackground: (query) => ApiRequest.delete('/remove-bg', {data: {...query}}),
    addArticle: (query) => ApiRequest.post('/article', {data: {...query}}),
    removeArticle: (query) => ApiRequest.delete('/article', {data: {...query}})
}
