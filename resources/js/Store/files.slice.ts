import {createAsyncThunk, createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {TypeRootState} from "@/Store/store";
import {filesApi} from "@/API/files.api";


const filesAdapter = createEntityAdapter()

interface FilesState {
    filesToUpload: string
}

const initialState = filesAdapter.getInitialState<FilesState>({
    filesToUpload: ""
})

export const filesSlice = createSlice({
    name: "files",
    initialState,
    reducers: {
        addFiles: (state, action) => {
            console.log('addFiles', action.payload)
            filesAdapter.addMany(state, action.payload)
        },
        resetFilesToUpload: () => {
            filesAdapter.removeAll
        }
    },
    extraReducers: builder =>
        builder
            .addCase(uploadNewImageFiles.fulfilled, (state, action) => {})
})

export const {
    selectAll: selectAllFiles,
    selectById: selectFilesById,
    selectIds: selectFilesIds

} = filesAdapter.getSelectors<TypeRootState>(state => state.files)
export const filesReducer = filesSlice.reducer
export const filesActions = filesSlice.actions

export const uploadNewImageFiles = createAsyncThunk(
    'files/uploadNewImageFiles',
    async (query: {files: FormData}, {rejectWithValue}) => {
        try {
            console.log('async', query.files);
            let response =  await filesApi.upload(query.files);
            console.log(response)
        } catch (error) {
            rejectWithValue(error)
        }
    }
)
