import second from '../../../../lib/axios'


export const adminProfileUpdate = async (data) => { 
  try {
    const apiResponse = await api.patch("/admin/profile", data);

    return apiResponse.data 

  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminProfileGet = async () =>{
    try{
        const apiResponse = await api.get("/admin/profile");

        return apiResponse.data

    }catch(error){
        throw error.response?.data || error;    
    }
}