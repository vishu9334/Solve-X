import api from '../../../lib/axios'

export const loginApi = async(data)=>{
    try {
        const apiResponse = await api.post('/login',data);
        return apiResponse.data;

    } catch (error) {
        throw error.response?.data || error;
    }
}