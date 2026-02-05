import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Blog = {
  id: string;
  created_at: string;
  title: string;
  content: string;
  image_url: string | null;
  username: string | null;
};

type Comment = {
  id: string;
  blog_id: string;
  parent_id: string | null;
  created_at: string;
  content: string;
  image_url: string | null;
};

const fallbackImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f1f5f9'/><rect x='170' y='110' width='260' height='180' rx='16' fill='%23e2e8f0'/><path d='M220 250l60-60 50 50 30-30 70 70H220z' fill='%2394a3b8'/><circle cx='260' cy='160' r='18' fill='%2394a3b8'/></svg>";

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<"update" | "delete" | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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
        setBlog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch post");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
      try {
        setCommentError(null);
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("blog_id", id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        setCommentError(err instanceof Error ? err.message : "Failed to load comments");
      }
    };

    fetchComments();
  }, [id]);

  const handleAddComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    if (!commentText.trim()) {
      setCommentError("Comment is required.");
      return;
    }

    try {
      setIsSubmittingComment(true);
      setCommentError(null);

      let imageUrl: string | null = null;

      if (commentImage) {
        const extension = commentImage.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `comments/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from("comment-images")
          .upload(filePath, commentImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase
          .storage
          .from("comment-images")
          .getPublicUrl(filePath);

        imageUrl = publicData?.publicUrl ?? null;
      }

      const { error: insertError } = await supabase
        .from("comments")
        .insert({
          blog_id: id,
          content: commentText.trim(),
          image_url: imageUrl,
          parent_id: null,
        });

      if (insertError) throw insertError;

      setCommentText("");
      setCommentImage(null);

      const { data: updated, error: refreshError } = await supabase
        .from("comments")
        .select("*")
        .eq("blog_id", id)
        .order("created_at", { ascending: false });

      if (refreshError) throw refreshError;
      setComments(updated || []);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddReply = async (event: React.FormEvent<HTMLFormElement>, parentId: string) => {
    event.preventDefault();
    if (!id) return;
    if (!replyText.trim()) {
      setCommentError("Reply is required.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      setCommentError(null);

      let imageUrl: string | null = null;

      if (replyImage) {
        const extension = replyImage.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `comments/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from("comment-images")
          .upload(filePath, replyImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase
          .storage
          .from("comment-images")
          .getPublicUrl(filePath);

        imageUrl = publicData?.publicUrl ?? null;
      }

      const { error: insertError } = await supabase
        .from("comments")
        .insert({
          blog_id: id,
          parent_id: parentId,
          content: replyText.trim(),
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      setReplyText("");
      setReplyImage(null);
      setReplyTo(null);

      const { data: updated, error: refreshError } = await supabase
        .from("comments")
        .select("*")
        .eq("blog_id", id)
        .order("created_at", { ascending: false });

      if (refreshError) throw refreshError;
      setComments(updated || []);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to add reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const buildThread = (items: Comment[], parentId: string | null = null): Comment[] =>
    items.filter((item) => item.parent_id === parentId);

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">
        {new Date(comment.created_at).toLocaleString()}
      </p>
      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
        {comment.content}
      </p>
      {comment.image_url && (
        <img
          src={comment.image_url}
          alt="Comment"
          className="mt-3 h-40 w-40 rounded-lg object-cover border border-gray-200"
        />
      )}
      <button
        type="button"
        onClick={() => setReplyTo((prev) => (prev === comment.id ? null : comment.id))}
        className="mt-3 inline-flex items-center rounded-lg !bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white hover:!bg-gray-900"
      >
        Reply
      </button>

      {replyTo === comment.id && (
        <form onSubmit={(event) => handleAddReply(event, comment.id)} className="mt-3 space-y-3">
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder="Write a reply..."
            className="w-full min-h-[90px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setReplyImage(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-300"
          />
          <button
            type="submit"
            disabled={isSubmittingReply}
            className="rounded-lg !bg-gray-900/90 px-4 py-2 text-sm font-semibold text-white hover:!bg-gray-900 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !outline-none !ring-0 !ring-offset-0 disabled:opacity-60"
          >
            {isSubmittingReply ? "Replying..." : "Post reply"}
          </button>
        </form>
      )}

      {buildThread(comments, comment.id).length > 0 && (
        <div className="mt-4 space-y-4 border-l border-gray-200 pl-4">
          {buildThread(comments, comment.id).map((child) => renderComment(child, depth + 1))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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

  if (!blog) {
    return (
      <div className="w-full px-6 mt-10">Post not found.</div>
    );
  }

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("Delete this post? This cannot be undone.");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError(null);

      if (blog.image_url) {
        const match = blog.image_url.match(/\/storage\/v1\/object\/public\/blog-images\/(.+)$/);
        const filePath = match?.[1];
        if (filePath) {
          await supabase.storage.from("blog-images").remove([filePath]);
        }
      }

      const { error: deleteError } = await supabase
        .from("blogs")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="w-full px-6 mt-10 mb-10 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{blog.title}</h1>
          <p className="text-sm text-gray-500">
            {new Date(blog.created_at).toLocaleString()} · By {blog.username ?? "Anonymous"}
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full !bg-white !text-black shadow-sm hover:!bg-gray-100"
            aria-label="Open actions"
          >
            ⋮
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 shadow-lg"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/update/${id}`);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                onMouseEnter={() => setHoveredAction("update")}
                onMouseLeave={() => setHoveredAction(null)}
                style={{
                  backgroundColor: hoveredAction === "update" ? "#f3f4f6" : "#ffffff",
                  color: "#111827",
                }}
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleDelete();
                }}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 disabled:opacity-60"
                onMouseEnter={() => setHoveredAction("delete")}
                onMouseLeave={() => setHoveredAction(null)}
                style={{
                  backgroundColor: hoveredAction === "delete" ? "#f3f4f6" : "#ffffff",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="w-full overflow-hidden rounded-2xl border border-gray-200">
        <img
          src={blog.image_url ?? fallbackImage}
          alt={blog.title}
          className="w-full max-h-[480px] object-cover"
        />
      </div>

      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {blog.content}
      </p>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setCommentImage(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-300"
          />
          {commentError && (
            <p className="text-sm text-red-600">{commentError}</p>
          )}
          <button
            type="submit"
            disabled={isSubmittingComment}
            className="rounded-lg !bg-gray-900/90 px-4 py-2 text-sm font-semibold text-white hover:!bg-gray-900 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !outline-none !ring-0 !ring-offset-0 disabled:opacity-60"
          >
            {isSubmittingComment ? "Posting..." : "Post comment"}
          </button>
        </form>

        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}
          {buildThread(comments).map((comment) => renderComment(comment))}
        </div>
      </section>
    </article>
  );
}
