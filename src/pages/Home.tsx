import { useEffect, useState } from "react";
import BlogCard from "../components/BlogCard";
import { supabase } from "../lib/supabase";

type Blog = {
  id: string;
  created_at: string;
  title: string;
  content: string;
  image_url: string | null;
  username: string | null;
};

const fallbackImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f1f5f9'/><rect x='170' y='110' width='260' height='180' rx='16' fill='%23e2e8f0'/><path d='M220 250l60-60 50 50 30-30 70 70H220z' fill='%2394a3b8'/><circle cx='260' cy='160' r='18' fill='%2394a3b8'/></svg>";

export default function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBlogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <div className="w-full px-6 mt-10 space-y-4">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {blogs.map((blog) => (
        <BlogCard
          key={blog.id}
          id={blog.id}
          title={blog.title}
          author={blog.username ?? "Anonymous"}
          content={blog.content}
          image={blog.image_url ?? fallbackImage}
        />
      ))}
    </div>
  );
}
