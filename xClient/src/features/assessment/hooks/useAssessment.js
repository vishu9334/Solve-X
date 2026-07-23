import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSpecializationsApi,
  getActiveAssessmentApi,
  selectSpecializationApi,
  startActivitySessionApi,
  recordActivityEventApi,
  submitAssessmentApi,
} from '../api/assessment.api.js';
import useAuthStore from '../../auth/store/auth.store.js';

export const useGetSpecializations = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['specializations'],
    queryFn: getSpecializationsApi,
    enabled: !!accessToken,
    select: (response) => response?.data || [],
  });
};

export const useGetActiveAssessment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['activeAssessment'],
    queryFn: getActiveAssessmentApi,
    enabled: !!accessToken,
    select: (response) => response?.data || null,
  });
};

export const useSelectSpecialization = () => {
  return useMutation({
    mutationFn: selectSpecializationApi,
  });
};

export const useStartActivitySession = () => {
  return useMutation({
    mutationFn: startActivitySessionApi,
  });
};

export const useRecordActivityEvent = () => {
  return useMutation({
    mutationFn: recordActivityEventApi,
  });
};

export const useSubmitAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitAssessmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorDashboard'] });
    },
  });
};
