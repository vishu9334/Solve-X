import api from '../../../../lib/axios.js'


export const studentProfileUpdate = async (data) => { 
  try {
    const apiResponse = await api.patch("/student/profile", data);

    return apiResponse.data 

  } catch (error) {
    throw error.response?.data || error;
  }
};

export const studentProfileGet = async () =>{
    try{
        const apiResponse = await api.get("/student/profile");

        return apiResponse.data

    }catch(error){
        throw error.response?.data || error; 
    }
}
