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
    <header className="sticky top-0 z-20 w-full border-b border-gray-900/20 bg-gray-900/90 text-white backdrop-blur overflow-x-hidden">
      <div className="relative mx-auto flex w-full flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight !text-white"
        >
          Simple Blog
        </Link>

        {user && (
          <div className="max-w-[160px] truncate text-xs font-semibold text-white sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[240px] sm:text-sm">
            Welcome, {username}!
          </div>
        )}

        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="rounded-full px-3 py-2 text-xs font-medium !text-white transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
            >
              {link.name}
            </Link>
          ))}

          {!user && (
            <>
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-xs font-medium !text-white transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full px-3 py-2 text-xs font-medium !text-white transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-2 text-xs font-medium !text-white transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}