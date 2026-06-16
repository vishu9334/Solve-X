import { create } from "zustand";
import {devtools} from 'zustand/middleware';

const useAuthStore = create(devtools((set)=>({
    accessToken: null,
    user:null,

    setAccessToken:(token)=>set({accessToken: token}),
    setUser: (user)=>set({user:user}),
    logout: ()=> set({accessToken:null, user:null})
})))

export default useAuthStore