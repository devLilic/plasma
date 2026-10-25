import {ApiRequest} from '@/API/API';
import {Image} from '@/types';

export const oldImagesApi = {
    scan: (): Promise<Image[]> => ApiRequest.get('/images/stale'),
    exclude: (imageIds: number[]): Promise<{excluded_ids: number[]}> => ApiRequest.post('/images/stale/exclusions', {
        data: {image_ids: imageIds},
    }),
    clean: (imageIds: number[]): Promise<{deleted_ids: number[]}> => ApiRequest.delete('/images/stale', {
        data: {data: {image_ids: imageIds}},
    }),
};
