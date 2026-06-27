import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSpecializationsApi,
  getActiveAssessmentApi,
  selectSpecializationApi,
  startActivitySessionApi,
  recordActivityEventApi,
  submitAssessmentApi,
} from '../api/assessment.api.js';

export const useGetSpecializations = () => {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: getSpecializationsApi,
    select: (response) => response?.data || [],
  });
};

export const useGetActiveAssessment = () => {
  return useQuery({
    queryKey: ['activeAssessment'],
    queryFn: getActiveAssessmentApi,
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
