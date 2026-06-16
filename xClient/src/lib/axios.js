import axios from "axios";
import useAuthStore from '../features/auth/store/auth.store.js'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
    }
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

api.interceptors.response.use((response) => {
    return response
},
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshResponse = await api.post('/regenerate-token');
                console.log('reeeefresg', refreshResponse);
                const newAccessToken = refreshResponse.data.accessToken;
                useAuthStore.getState().setAccessToken(newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                return api(originalRequest);
            } catch (error) {
                useAuthStore.getState().logout()
                window.location.href = '/login'
            }

        }
    }
)
export default api