import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAppSelector } from "../store/hooks";

export default function Create() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleCreateBlog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError("Please log in to create a post.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const username = (user.user_metadata?.username as string | undefined)?.trim() || "Anonymous";

      let imageUrl: string | null = null;

      if (imageFile) {
        const extension = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `blog/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from("blog-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase
          .storage
          .from("blog-images")
          .getPublicUrl(filePath);

        imageUrl = publicData?.publicUrl ?? null;
      }

      const { error: insertError } = await supabase
        .from("blogs")
        .insert({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
          username,
        });

      if (insertError) throw insertError;

      setTitle("");
      setContent("");
      setImageFile(null);

      navigate("/");
    } catch (err) {
      console.error("Create post error:", err);
      if (err && typeof err === "object" && "message" in err) {
        setError(String((err as { message?: string }).message ?? "Failed to create post"));
      } else {
        setError(`Failed to create post: ${JSON.stringify(err)}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-10 mt-8 w-[calc(100%-5rem)] px-6 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Create a new post</h2>
      <form onSubmit={handleCreateBlog} className="mt-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Post title"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full min-h-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Write something..."
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="image">Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-300"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg !bg-gray-900/90 px-4 py-2 text-sm font-semibold text-white hover:!bg-gray-900 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !outline-none !ring-0 !ring-offset-0 disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create post"}
        </button>
      </form>
    </section>
  );
}
