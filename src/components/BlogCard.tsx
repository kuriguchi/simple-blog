import { Link } from "react-router-dom";

type BlogCardProps = {
  id: string;
  title: string;
  author: string;
  content: string;
  image: string;
};

export default function ArticleCard({ id, title, author, content, image }: BlogCardProps) {
  return (
    <Link to={`/blog/${id}`} className="block">
      <article className="mx-96 flex gap-4 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">

      {/* Image */}
      <div className="w-32 h-32 shrink-0 overflow-hidden rounded-lg">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col justify-between flex-1">

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
          {title}
        </h2>

        <p className="text-xs text-gray-500">By {author}</p>

        {/* Content Preview */}
        <p className="text-gray-600 text-sm line-clamp-3">
          {content}
        </p>

      </div>
      </article>
    </Link>
  );
}
