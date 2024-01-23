import {
    createAsyncThunk,
    createEntityAdapter,
    createSlice,
} from "@reduxjs/toolkit";
import {Image} from "@/types";
import axios from "axios";
import {TypeRootState} from "@/Store/store";

const imagesAdapter = createEntityAdapter<Image>()

export const imagesSlice = createSlice({
    name: "images",
    initialState: imagesAdapter.getInitialState(),
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchImages.fulfilled, (state, action) => {
                imagesAdapter.upsertMany(state, action.payload)
            })
            .addCase(searchImages.fulfilled, imagesAdapter.setAll)
    }
})

export const fetchImages = createAsyncThunk(
    'images/fetchImages',
    async () => {
        const response = await axios.get('/api/images')
        return response.data
    })

export const searchImages = createAsyncThunk(
    'images/searchImages',
    async (query, {rejectWithValue}) => {
        try {
            const response = await axios.get('/api/images/search', {
                params: {
                    query
                }
            })
            return response.data
        } catch (error) {
            return rejectWithValue('Error searching images')
        }
    }
)

export const {
    selectIds: selectImagesIds,
    selectAll: selectAllImages,
    selectById: selectImageById,
} = imagesAdapter.getSelectors<TypeRootState>(state => state.images)
export const imagesReducer = imagesSlice.reducer
export const imagesActions = imagesSlice.actions

