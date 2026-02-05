import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAppSelector } from "../store/hooks";

type NavLink = {
  name: string;
  href: string;
};

const links: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Create", href: "/create" },
];

export default function Navbar() {
  const user = useAppSelector((state) => state.auth.user);
  const username = (user?.user_metadata?.username as string | undefined) ?? user?.email ?? "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-gray-900/20 bg-gray-900/90 text-white backdrop-blur">
      <div className="relative mx-auto flex w-full items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight !text-white"
        >
          Simple Blog
        </Link>

        {user && (
          <div className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-white">
            Welcome, {username}!
          </div>
        )}

        <nav className="flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium !text-white transition hover:bg-white/10 hover:text-white"
            >
              {link.name}
            </Link>
          ))}

          {!user && (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium !text-white transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full px-4 py-2 text-sm font-medium !text-white transition hover:bg-white/10 hover:text-white"
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-4 py-2 text-sm font-medium !text-white transition hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}