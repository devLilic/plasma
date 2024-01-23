import {useDispatch} from "react-redux";
import {articlesActions} from "@/Store/article/article.slice";
import {bindActionCreators} from "@reduxjs/toolkit";
import {fetchImages, imagesActions, searchImages} from "@/Store/image/image.slice";


const allActions = {
    ...articlesActions,
    ...imagesActions,
    fetchImages,
    searchImages
}
export const useActions = () => {
    const dispatch = useDispatch()
    return bindActionCreators(allActions, dispatch)
}
