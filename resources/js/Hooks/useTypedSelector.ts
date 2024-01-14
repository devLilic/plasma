import {TypedUseSelectorHook, useSelector} from "react-redux";
import {TypeRootState} from "@/Store/store";

export const useTypedSelector: TypedUseSelectorHook<TypeRootState> = useSelector
