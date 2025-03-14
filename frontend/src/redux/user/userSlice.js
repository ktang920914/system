import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    signInStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signInSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    signInFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    signOutSuccess: (state) => {
      state.currentUser = null
      state.loading = false
      state.error = null
    }
  },
});

export const { signInStart, signInSuccess, signInFailure, clearError, signOutSuccess } = userSlice.actions;
export default userSlice.reducer;