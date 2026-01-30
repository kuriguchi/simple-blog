import { useEffect, useState, type SetStateAction } from "react";
import { createClient } from "@supabase/supabase-js";
import './App.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

type Blog = {
  id: string
  created_at: string
  content: string
}

function App() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null)

  const fetchBlogs = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('data', data);
      
      if (error) throw error

      setBlogs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    }
  }

  useEffect(() => {
    fetchBlogs();
  }, []);

  return(
    <div>
      <h2 >Fetched Data</h2>
      <ul>
        {blogs.map((item) => (
          <li key={item.id}>{item.content}</li>
        ))}
      </ul>
    </div>
  );
}

export default App


