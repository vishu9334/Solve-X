import api from '../../../../lib/axios.js'

export const adminDashboard = async () => {
    try {
        const apiResponse = await api.get("/dashboard/admin");
        return apiResponse.data
    } catch (error) {
        throw error.response?.data || error;
    }
}