
import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserstore = create(
  persist(
    (set) => ({
      currentUser: null,
      error: null,
      loading: false,

      signInStart: () => set({ loading: true, error: null }),
      signInSuccess: (user) => set({ currentUser: user, loading: false, error: null }),
      signInFailure: (error) => set({ error, loading: false }),
      clearError:() => set({error: null}),
      signOutSuccess: () => set({ currentUser: null, loading: false, error: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserstore;
