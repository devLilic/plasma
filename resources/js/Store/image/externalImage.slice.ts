import {createAsyncThunk, createEntityAdapter, createSlice, nanoid, PayloadAction} from "@reduxjs/toolkit";
import axios from "axios";
import {TypeRootState} from "@/Store/store";
import {ExternalImage, SelectedExternalImage} from "@/types";
import apiRequest from "@/Helpers/Api";


const externalImagesAdapter = createEntityAdapter<ExternalImage>()

interface InitialState {
    loading: boolean,
    error: string | null
    query: string
    selected: SelectedExternalImage
}

const initialState = externalImagesAdapter.getInitialState<InitialState>({
    loading: false,
    error: null,
    query: '',
    selected: {
        url: '',
        readyToCrop: false,
        croppedUrl: '',
        cropSection: {
            crop: {
                unit: 'px',
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            percentCrop: {
                unit: '%',
                x: 0,
                y: 0,
                width: 0,
                height: 0
            }
        },
    }
})

const externalImageSlice = createSlice({
    name: 'externalImages',
    initialState,
    reducers: {
        resetCrop: state => {
            state.selected.url = '';
        },
        selectExternalImage: (state, action: PayloadAction<{ url: string }>) => {
            state.selected.url = action.payload.url
        },
        setCropSection: (state, action) => {
            state.selected.cropSection.percentCrop = action.payload
        }
    },
    extraReducers: builder =>
        builder
            .addCase(fetchExternalImages.pending, (state, action) => {
                state.loading = true
            })
            .addCase(fetchExternalImages.fulfilled, (state, action) => {
                state.loading = false
                const images = action.payload.images.map((image: ExternalImage) => {
                    image.id = nanoid()
                    return image
                })
                externalImagesAdapter.setAll(state, images)
            })
            .addCase(cropExternalImage.fulfilled, (state, action) => {
                state.entities.upsertOne
            })
})

export const {
    selectAll: selectAllExternalImages
} = externalImagesAdapter.getSelectors<TypeRootState>(state => state.externalImages)


export const externalImagesReducer = externalImageSlice.reducer
export const externalImagesActions = externalImageSlice.actions

export const fetchExternalImages = createAsyncThunk(
    'externalImages/fetchExternalImages',
    async (query, {rejectWithValue}) => {
        try {
            const response = await axios.get('/api/resources', {
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

export const cropExternalImage = createAsyncThunk(
    'externalImages/cropExternalImage',
    async (image: SelectedExternalImage, {rejectWithValue}) => {
        try {
            let data = {url: image.url, section: image.cropSection.percentCrop}
            const response = await axios.post('/api/crop', data)
            return response.data
        } catch (error) {
            return rejectWithValue('Error searching images')
        }
    }
)
