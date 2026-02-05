import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAppDispatch } from "./hooks";
import { setSession, setLoading } from "./authSlice";

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      dispatch(setLoading(true));
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        dispatch(setSession(data.session ?? null));
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession(session));
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
