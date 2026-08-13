import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";

export const API: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    timeout: 20000,
    withCredentials: true,
    withXSRFToken: true,
    headers: {'X-Requested-With': 'XMLHttpRequest'},
})

export const responseBody = (response: AxiosResponse) => response.data


export const ApiRequest = {
    get: (url: string, config?: AxiosRequestConfig) => API.get(url, config).then(responseBody),
    post: (url: string, config?: AxiosRequestConfig) => API.post(url, config).then(responseBody),
    delete: (url: string, config?: AxiosRequestConfig) => API.delete(url, config).then(responseBody),
    patch: (url: string, config?: AxiosRequestConfig) => API.patch(url, config).then(responseBody)
}
