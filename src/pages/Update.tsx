import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAppSelector } from "../store/hooks";

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const originalImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setError(null);
        if (!id) {
          setError("Missing blog id.");
          return;
        }

        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        const currentUsername = (user?.user_metadata?.username as string | undefined) ?? user?.email ?? null;
        const canEdit = Boolean(user && (data.user_id === user.id || (!data.user_id && currentUsername && data.username === currentUsername)));

        if (!canEdit) {
          setError("You do not have permission to edit this post.");
          return;
        }

        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        const existingImageUrl = data.image_url ?? null;
        setCurrentImageUrl(existingImageUrl);
        originalImageUrlRef.current = existingImageUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch post");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let imageUrl = currentImageUrl;
      const existingImageUrl = originalImageUrlRef.current;

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

        if (existingImageUrl) {
          const match = existingImageUrl.match(/\/storage\/v1\/object\/public\/blog-images\/(.+)$/);
          const oldPath = match?.[1];
          if (oldPath) {
            await supabase.storage.from("blog-images").remove([oldPath]);
          }
        }
      } else if (!imageFile && currentImageUrl === null && existingImageUrl) {
        const match = existingImageUrl.match(/\/storage\/v1\/object\/public\/blog-images\/(.+)$/);
        const oldPath = match?.[1];
        if (oldPath) {
          await supabase.storage.from("blog-images").remove([oldPath]);
        }
      }

      const { error: updateError } = await supabase
        .from("blogs")
        .update({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      navigate(`/blog/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 mt-10">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 mt-10 text-red-600">{error}</div>
    );
  }

  return (
    <section className="mx-3 mt-6 w-auto px-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm sm:mx-10 sm:mt-8 sm:w-[calc(100%-5rem)] sm:px-6">
      <h2 className="text-xl font-semibold text-gray-900">Update post</h2>
      <form onSubmit={handleUpdate} className="mt-4 space-y-4">
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

        <div className="space-y-2 flex flex-col items-start">
          <label className="text-sm font-medium text-gray-700" htmlFor="image">Image</label>
          {currentImageUrl && (
            <div className="relative inline-block">
              <img
                src={currentImageUrl}
                alt="Current"
                className="h-32 w-48 rounded-lg object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setCurrentImageUrl(null)}
                className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full w-7 h-7 flex items-center justify-center text-white text-lg font-bold hover:bg-red-600 transition"
                aria-label="Remove current image"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex w-full flex-col items-start gap-3">
            {imageFile && (
              <div className="mb-4 relative inline-block">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="h-48 w-48 rounded-xl object-cover border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setCurrentImageUrl(null);
                    originalImageUrlRef.current = null;
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full w-7 h-7 flex items-center justify-center text-white text-lg font-bold hover:bg-red-600 transition"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            )}
            <input
              id="image"
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setImageFile(nextFile);
                if (nextFile) {
                  setCurrentImageUrl(null);
                } else if (originalImageUrlRef.current) {
                  setCurrentImageUrl(originalImageUrlRef.current);
                }
              }}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-300"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg !bg-gray-900/90 px-4 py-2 text-sm font-semibold text-white hover:!bg-gray-900 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !outline-none !ring-0 !ring-offset-0 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Update post"}
        </button>
      </form>
    </section>
  );
}
