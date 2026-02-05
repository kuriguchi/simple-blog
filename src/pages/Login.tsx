import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAppSelector } from "../store/hooks";

export default function Login() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    navigate("/");
    return null;
  }

  return (
    <section className="mx-3 mt-6 w-auto px-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm sm:mx-10 sm:mt-8 sm:w-[calc(100%-5rem)] sm:px-6">
      <h2 className="text-xl font-semibold text-gray-900">Log in</h2>
      <form onSubmit={handleLogin} className="mt-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg !bg-gray-900/90 px-4 py-2 text-sm font-semibold text-white hover:!bg-gray-900 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !outline-none !ring-0 !ring-offset-0 disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-sm text-gray-600">
          No account? <Link to="/register" className="font-semibold text-gray-900">Register</Link>
        </p>
      </form>
    </section>
  );
}
