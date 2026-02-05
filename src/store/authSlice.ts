import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User, Session } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.loading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    signOut(state) {
      state.session = null;
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setSession, setLoading, signOut } = authSlice.actions;
export default authSlice.reducer;
