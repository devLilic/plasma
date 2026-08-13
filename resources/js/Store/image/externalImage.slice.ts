import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {CropImageWithTagsQuery, SelectedExternalImage} from '@/types';
import {externalImagesApi} from '@/API/externalImages.api';
import {articlesActions} from '@/Store/article/article.slice';
import {imagesActions} from '@/Store/image/image.slice';

interface ExternalImageState {
    loading: boolean;
    error: string | null;
    selected: SelectedExternalImage;
}

const emptySelection: SelectedExternalImage = {
    url: '',
    readyToCrop: false,
    croppedUrl: null,
    cropSection: {
        crop: {unit: 'px', x: 0, y: 0, width: 0, height: 0},
        percentCrop: {unit: '%', x: 0, y: 0, width: 0, height: 0},
    },
};

const initialState: ExternalImageState = {loading: false, error: null, selected: emptySelection};

const externalImageSlice = createSlice({
    name: 'externalImages',
    initialState,
    reducers: {
        resetCrop: state => {
            state.selected = emptySelection;
            state.error = null;
        },
        setExternalUrlLink: (state, action: PayloadAction<string>) => {
            state.selected.url = action.payload;
            state.error = null;
        },
    },
    extraReducers: builder => builder
        .addCase(cropExternalImage.pending, state => {
            state.loading = true;
            state.error = null;
        })
        .addCase(cropExternalImage.fulfilled, state => {
            state.loading = false;
            state.selected = emptySelection;
        })
        .addCase(cropExternalImage.rejected, (state, action) => {
            state.loading = false;
            state.error = (action.payload as string) ?? 'Imaginea nu a putut fi salvată.';
        }),
});

export const externalImagesReducer = externalImageSlice.reducer;
export const externalImagesActions = externalImageSlice.actions;

export const cropExternalImage = createAsyncThunk(
    'externalImages/cropExternalImage',
    async (query: CropImageWithTagsQuery, {dispatch, rejectWithValue}) => {
        try {
            const image = await externalImagesApi.crop(query);
            dispatch(articlesActions.setBackgroundImage(image));
            dispatch(imagesActions.upsertImage(image));
            return image;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message ?? 'Imaginea nu a putut fi salvată.');
        }
    },
);
