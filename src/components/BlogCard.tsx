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
    <Link to={`/blog/${id}`} className="block w-full">
      <article className="w-full max-w-full mx-2 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md overflow-hidden sm:flex-row lg:max-w-5xl lg:mx-auto">

      {/* Image */}
      <div className="h-44 w-full shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text Content */}
      <div className="flex min-w-0 flex-col justify-between flex-1">

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2 break-words">
          {title}
        </h2>

        <p className="text-xs text-gray-500">By {author}</p>

        {/* Content Preview */}
        <p className="text-gray-600 text-sm line-clamp-3 break-words">
          {content}
        </p>

      </div>
      </article>
    </Link>
  );
}
