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
    reducers: {
        setImages: (state, action: PayloadAction<Image[]>) => {
            imagesAdapter.setAll(state, action.payload)
        },
        upsertImage: (state, action: PayloadAction<Image>) => {
            imagesAdapter.upsertOne(state, action.payload)
        },
    },

    extraReducers: builder => {
        builder
            .addCase(fetchImages.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchImages.fulfilled, (state, action: PayloadAction<Image[]>) => {
                state.loading = false
                imagesAdapter.setAll(state, action.payload)
            })
            .addCase(fetchImages.rejected, (state) => {
                state.loading = false
                state.error = 'Imaginile nu au putut fi încărcate.'
            })
            .addCase(searchImages.fulfilled, imagesAdapter.setAll)
            .addCase(removeImage.fulfilled, (state, action: PayloadAction<{ id: number }>) => {
                imagesAdapter.removeOne(state, action.payload.id)
            })
            .addCase(updateImage.fulfilled, (state, action) => {
                imagesAdapter.upsertOne(state, action.payload)
            })
    }
})

export const fetchImages = createAsyncThunk(
    'images/fetchImages',
    async (limit: number | undefined, {rejectWithValue}) => {
        try {
            return await imagesApi.fetch(limit)
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

export const updateImage = createAsyncThunk(
    'images/updateImage',
    async (query: { id: number, tags?: string, section?: import('react-image-crop').PercentCrop }, {rejectWithValue}) => {
        try {
            return await imagesApi.update(query.id, query.tags, query.section)
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message ?? 'Imaginea nu a putut fi actualizată.')
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
