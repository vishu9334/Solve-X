import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSpecialistMentorApi, askDoubtApi, getSpecializationMentorsApi, getDoubtSessionOffersApi, selectMentorApi, getDoubtSessionDetailsApi, endDoubtSessionApi, getActiveSessionApi, startVideoCallApi } from "../api/doubt.api.js";
import useAuthStore from "../../auth/store/auth.store.js";

export const useGetSpecialistMentors = (specializationName = "")=>{
    const accessToken = useAuthStore((state) => state.accessToken);
    return useQuery({
        queryKey:["specialistMentors",specializationName],
        queryFn: ()=> getSpecialistMentorApi(specializationName),
        enabled: !!accessToken,
        select: (response)=> response?.data || response,
    });
}

export const useGetSpecializationMentors = (specializationId) => {
    const accessToken = useAuthStore((state) => state.accessToken);
    return useQuery({
        queryKey: ["specializationMentors", specializationId],
        queryFn: () => getSpecializationMentorsApi(specializationId),
        enabled: !!specializationId && !!accessToken,
        select: (response) => response?.data || response,
    });
};


export const useAskDoubt =()=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: askDoubtApi,
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey: ["studentDashboard"]});
        }
    })
}

// 1. Hook: Offers fetch करने के लिए
export const useGetDoubtSessionOffers = (doubtSessionId) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ["doubtSessionOffers", doubtSessionId],
    queryFn: () => getDoubtSessionOffersApi(doubtSessionId),
    enabled: !!doubtSessionId && !!accessToken,
    select: (response) => response?.data || response,
  });
};

// 2. Hook: Mentor select/accept mutation
export const useSelectMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: selectMentorApi,
    onSuccess: (data, variables) => {
      // Invalidate dashboard and details queries
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["doubtSessionDetails", variables.doubtSessionId] });
    },
  });
};

// 3. Hook: Doubt details fetch करने के लिए
export const useGetDoubtSessionDetails = (doubtSessionId) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ["doubtSessionDetails", doubtSessionId],
    queryFn: () => getDoubtSessionDetailsApi(doubtSessionId),
    enabled: !!doubtSessionId && !!accessToken,
    select: (response) => response?.data || response,
  });
};

// 4. Hook: Session end mutation
export const useEndDoubtSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endDoubtSessionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    },
  });
};

// 5. Hook: Active session fetch करने के लिए
export const useGetActiveSession = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ["activeSession"],
    queryFn: getActiveSessionApi,
    enabled: !!accessToken,
    select: (response) => response?.data || response,
  });
};

// 6. Hook: Start Video Call mutation
export const useStartVideoCall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startVideoCallApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doubtSessionDetails", variables] });
    },
  });
};
