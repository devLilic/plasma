import {ApiRequest} from '@/API/API';
import {Tag} from '@/types';

export const tagsApi = {
    suggestions: (query: string): Promise<Tag[]> => ApiRequest.get('/tags', {params: {query}}),
};
