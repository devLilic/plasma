import {useDispatch} from "react-redux";
import {
    articlesActions,
    setBackgroundImage,
    removeBackgroundImage,
    addNewArticle,
    deleteArticle
} from "@/Store/article/article.slice";
import {bindActionCreators} from "@reduxjs/toolkit";
import {fetchImages, imagesActions, removeImage, searchImages} from "@/Store/image/image.slice";
import {externalImagesActions, fetchExternalImages, cropExternalImage} from "@/Store/image/externalImage.slice";
import {filesActions, uploadNewImageFiles} from "@/Store/files.slice";


const allActions = {
    ...articlesActions,
    ...imagesActions,
    ...externalImagesActions,
    ...filesActions,
    fetchImages,
    searchImages,
    fetchExternalImages,
    cropExternalImage,
    removeImage,
    setBackgroundImage,
    removeBackgroundImage,
    addNewArticle,
    deleteArticle,
    uploadNewImageFiles
}
export const useActions = () => {
    const dispatch = useDispatch()
    return bindActionCreators(allActions, dispatch)
}
