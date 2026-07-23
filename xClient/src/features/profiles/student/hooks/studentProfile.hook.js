import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { studentProfileUpdate, studentProfileGet } from '../api/studentProfile.api.js'
import { toast } from 'react-toastify'
import useAuthStore from '../../../auth/store/auth.store.js'

export const useGetStudentProfile = () => {
    const accessToken = useAuthStore((state) => state.accessToken)

    return useQuery({
        queryKey: ['studentProfile'],
        queryFn: studentProfileGet,
        enabled: !!accessToken,
    })
}

export const useUpdateStudentProfile = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data) => studentProfileUpdate(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['studentProfile'] })
            toast.success(data.message) 
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}
