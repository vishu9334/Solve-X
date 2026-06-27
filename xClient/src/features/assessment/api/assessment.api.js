import api from '../../../lib/axios.js';

export const getSpecializationsApi = async () => {
  try {
    const response = await api.get('/specializations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getActiveAssessmentApi = async () => {
  try {
    const response = await api.get('/mentor/active-assessment');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const selectSpecializationApi = async ({ specializationId, specializationName }) => {
  try {
    const response = await api.post('/mentor/select-specialization', {
      specializationId,
      specializationName,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * POST /activity-sessions/start
 * Internally creates a TEST_STARTED event — no need to fire another one after this.
 */
export const startActivitySessionApi = async ({ category, screen }) => {
  try {
    const response = await api.post('/activity-sessions/start', { category, screen });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * POST /activity-sessions/:sessionId/events
 * Note: 'severity' is NOT in the server validator body schema, so we omit it.
 */
export const recordActivityEventApi = async ({ sessionId, eventType, message = '', screen = {}, metadata = {} }) => {
  try {
    const response = await api.post(`/activity-sessions/${sessionId}/events`, {
      eventType,
      message,
      screen,
      metadata,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitAssessmentApi = async ({ attemptId, answers }) => {
  try {
    const response = await api.post(`/mentor/submit-assessment/${attemptId}`, { answers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
