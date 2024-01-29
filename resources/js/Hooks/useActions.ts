import {useDispatch} from "react-redux";
import {articlesActions} from "@/Store/article/article.slice";
import {bindActionCreators} from "@reduxjs/toolkit";
import {fetchImages, imagesActions, searchImages} from "@/Store/image/image.slice";
import {externalImagesActions, fetchExternalImages, cropExternalImage} from "@/Store/image/externalImage.slice";


const allActions = {
    ...articlesActions,
    ...imagesActions,
    ...externalImagesActions,
    fetchImages,
    searchImages,
    fetchExternalImages,
    cropExternalImage
}
export const useActions = () => {
    const dispatch = useDispatch()
    return bindActionCreators(allActions, dispatch)
}
