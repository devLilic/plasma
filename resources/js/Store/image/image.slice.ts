import {
    createAsyncThunk,
    createEntityAdapter,
    createSlice, PayloadAction,
} from "@reduxjs/toolkit";
import {Image} from "@/types";
import {TypeRootState} from "@/Store/store";
import {imagesApi} from "@/API/images.api";

const imagesAdapter = createEntityAdapter<Image>({
    sortComparer: (a, b) => b.id - a.id
})

const initialState = imagesAdapter.getInitialState({
    loading: false,
    error: ''
})

export const imagesSlice = createSlice({
    name: "images",
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchImages.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchImages.fulfilled, (state, action: PayloadAction<Image[]>) => {
                state.loading = false
                imagesAdapter.upsertMany(state, action.payload)
            })
            .addCase(searchImages.fulfilled, imagesAdapter.setAll)
            .addCase(removeImage.fulfilled, (state, action: PayloadAction<{ id: number }>) => {
                imagesAdapter.removeOne(state, action.payload.id)
            })
            .addCase(addTags.fulfilled, (state, action) => {
                imagesAdapter.upsertOne(state, action.payload)
            })
    }
})

export const fetchImages = createAsyncThunk(
    'images/fetchImages',
    async (_, {rejectWithValue}) => {
        try {
            return await imagesApi.fetch()
        } catch (error) {
            return rejectWithValue(error)
        }
    })

export const searchImages = createAsyncThunk(
    'images/searchImages',
    async (query: string) => {
        return await imagesApi.search(query)
    }
)

export const removeImage = createAsyncThunk(
    'images/removeImage',
    async (id: number) => {
        return await imagesApi.delete(id)
    }
)

export const addTags = createAsyncThunk(
    'images/addTags',
    async (query: { id: number, tags: string }, {rejectWithValue}) => {
        return await imagesApi.addTags(query.id, query.tags)
    }
)

export const {
    selectIds: selectImagesIds,
    selectAll: selectAllImages,
    selectById: selectImageById,
} = imagesAdapter.getSelectors<TypeRootState>(state => state.images)
export const imagesReducer = imagesSlice.reducer
export const imagesActions = imagesSlice.actions

