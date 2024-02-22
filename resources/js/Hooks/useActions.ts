import {useDispatch} from "react-redux";
import {articlesActions, setBackgroundImage, removeBackgroundImage, addNewArticle} from "@/Store/article/article.slice";
import {bindActionCreators} from "@reduxjs/toolkit";
import {fetchImages, imagesActions, removeImage, searchImages} from "@/Store/image/image.slice";
import {externalImagesActions, fetchExternalImages, cropExternalImage} from "@/Store/image/externalImage.slice";


const allActions = {
    ...articlesActions,
    ...imagesActions,
    ...externalImagesActions,
    fetchImages,
    searchImages,
    fetchExternalImages,
    cropExternalImage,
    removeImage,
    setBackgroundImage,
    removeBackgroundImage,
    addNewArticle
}
export const useActions = () => {
    const dispatch = useDispatch()
    return bindActionCreators(allActions, dispatch)
}
