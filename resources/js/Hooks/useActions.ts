import {useDispatch} from "react-redux";
import {articleActions} from "@/Store/article/article.slice";
import {bindActionCreators} from "@reduxjs/toolkit";


const allActions = {
    ...articleActions
}
export const useActions = () => {
    const dispatch = useDispatch()

    return bindActionCreators(allActions, dispatch)
}


