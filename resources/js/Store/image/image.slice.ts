import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Image} from "@/types";

interface InitialState {
    images: Image[]
}

const initialState = {
    images: []
}

export const imageSlice = createSlice({
    name: "image",
    initialState,
    reducers: {
        getImage: (action, payload: PayloadAction<{ id: number}>) => {
            return
        }
    }
})
