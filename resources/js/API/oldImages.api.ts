import {ApiRequest} from '@/API/API';
import {Image} from '@/types';

export const oldImagesApi = {
    scan: (): Promise<Image[]> => ApiRequest.get('/images/stale'),
    clean: (imageIds: number[]): Promise<{deleted_ids: number[]}> => ApiRequest.delete('/images/stale', {
        data: {data: {image_ids: imageIds}},
    }),
};
