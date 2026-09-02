import {useDispatch} from "react-redux";
import {
    articlesActions,
    setBackgroundImage,
    removeBackgroundImage,
    addNewArticle,
    deleteArticle,
    saveArticleContent,
    updateTextHighlight,
} from "@/Store/article/article.slice";
import {bindActionCreators} from "@reduxjs/toolkit";
import {fetchImages, imagesActions, removeImage, searchImages, updateImage} from "@/Store/image/image.slice";
import {externalImagesActions, cropExternalImage} from "@/Store/image/externalImage.slice";
import {AppDispatch} from '@/Store/store';


const allActions = {
    ...articlesActions,
    ...imagesActions,
    ...externalImagesActions,
    fetchImages,
    searchImages,
    cropExternalImage,
    updateImage,
    removeImage,
    setBackgroundImage,
    removeBackgroundImage,
    addNewArticle,
    deleteArticle,
    saveArticleContent,
    updateTextHighlight
}
export const useActions = () => {
    const dispatch = useDispatch<AppDispatch>()
    return bindActionCreators(allActions, dispatch)
}
