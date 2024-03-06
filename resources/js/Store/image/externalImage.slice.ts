import {createAsyncThunk, createEntityAdapter, createSlice, nanoid, PayloadAction} from "@reduxjs/toolkit";
import {TypeRootState} from "@/Store/store";
import {CropImageWithTagsQuery, ExternalImage, SelectedExternalImage} from "@/types";
import {externalImagesApi} from "@/API/externalImages.api";
import {articlesActions, setBackgroundImage} from "@/Store/article/article.slice";
import {addTags, imagesActions} from "@/Store/image/image.slice";
import {ErrorPayload} from "vite";

const externalImagesAdapter = createEntityAdapter<ExternalImage>()

interface LoaddedArticle {
    id: number,
    images: ExternalImage[]
}

interface InitialState {
    loading: boolean,
    error: string | null
    query: string
    cache: LoaddedArticle[]
    selected: SelectedExternalImage
}

const initialState = externalImagesAdapter.getInitialState<InitialState>({
    loading: false,
    error: null,
    query: '',
    cache: [],
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
        },
        setExternalUrlLink: (state, action: PayloadAction<string>) => {
            state.selected.url = action.payload
        },
        changeQuery: (state, action: PayloadAction<string>) => {
            state.query = action.payload
        }
    },
    extraReducers: builder =>
        builder
            .addCase(fetchExternalImages.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchExternalImages.fulfilled, (state, action) => {
                state.loading = false
                externalImagesAdapter.setAll(state, action.payload.images)
            })
            .addCase(fetchExternalImages.rejected, state => {
                state.loading = false
            })
})

export const {
    selectAll: selectAllExternalImages
} = externalImagesAdapter.getSelectors<TypeRootState>(state => state.externalImages)

export const externalImagesReducer = externalImageSlice.reducer
export const externalImagesActions = externalImageSlice.actions

export const fetchExternalImages = createAsyncThunk(
    'externalImages/fetchExternalImages',
    async (query: string, {rejectWithValue}) => {
        try {
            const response = await externalImagesApi.fetch(query)
            if(response.images){
                const images = response.images.map((image: ExternalImage) => {
                    image.id = nanoid()
                    return image
                })
                return {images, next_page: response.next_page}
            }
            return {images: []}
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const cropExternalImage = createAsyncThunk(
    'externalImages/cropExternalImage',
    async (query: CropImageWithTagsQuery, {dispatch, rejectWithValue}) => {
        try {
            const croppedImage = await externalImagesApi.crop(query)

            dispatch(setBackgroundImage({article_id: query.article_id, image_id: croppedImage.id}))
            dispatch(addTags({id: croppedImage.id, tags: query.tags}))

        } catch (error) {
            return rejectWithValue(error)
        }
    }
)
