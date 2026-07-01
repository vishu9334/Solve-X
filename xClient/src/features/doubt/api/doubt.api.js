import api from '../../../lib/axios.js'

export const getSpecialistMentorApi = async(specializationName='')=>{
    try {
        const response = await api.get("/student/mentors",{
            params:{specializationName}
        })
        return response.data
    } catch (error) {
        throw error.response?.data || error
    }
};

export const askDoubtApi = async ({specializationIdentifier, selectSessionTime, questionText, sessionType, scheduledTime})=>{
    try {
    const response = await api.post(
      `/student/ask-doubt?specializationIdentifier=${specializationIdentifier}&selectSessionTime=${selectSessionTime}`,
      { typeWriteQuestion: questionText, sessionType, scheduledTime }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export const getSpecializationMentorsApi = async (specializationId) => {
  try {
    const response = await api.get(`/student/specializations/${specializationId}/mentors`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
// 1. Specific doubt session के offers/bids fetch करने के लिए
export const getDoubtSessionOffersApi = async (doubtSessionId) => {
  try {
    const response = await api.get(`/student/doubt-sessions/${doubtSessionId}/offers`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 2. Student द्वारा mentor select/accept करने के लिए
export const selectMentorApi = async ({ doubtSessionId, selectedMentorId }) => {
  try {
    const response = await api.post(`/student/select-mentor/${doubtSessionId}`, {
      selectedMentorId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 3. Doubt session की complete details (chat history, status) fetch करने के लिए
export const getDoubtSessionDetailsApi = async (doubtSessionId) => {
  try {
    const response = await api.get(`/student/doubt-sessions/${doubtSessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 4. Doubt session को manually end करने के लिए
export const endDoubtSessionApi = async (doubtSessionId) => {
  try {
    const response = await api.post(`/student/end-session/${doubtSessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 5. Active session retrieve करने के लिए
export const getActiveSessionApi = async () => {
  try {
    const response = await api.get("/student/active-session");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 6. Start Video Call / Generate Daily Room (Mentor only)
export const startVideoCallApi = async (doubtSessionId) => {
  try {
    const response = await api.post(`/daily/connect/${doubtSessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
