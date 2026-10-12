import { Link } from "react-router-dom";
import { subscriptionResourceThumbnail } from "../../utils/subscriptionDisplay";

export default function SubscriptionResourceCard({ resource }) {
  const title = resource?.title || resource?.name || "Resource";
  const description = resource?.description || "";
  const image = subscriptionResourceThumbnail(resource);
  const category = resource?.categoryId?.name;
  const fileCount = (resource?.files || []).length;

  return (
    <div className="w-[280px] glass-card overflow-hidden hover:shadow-glow-indigo-soft transition group">
      <div className="aspect-[4/3] bg-brand/10 overflow-hidden flex items-center justify-center">
        <img
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          src={image}
          alt=""
          onError={(e) => {
            e.currentTarget.src =
              "https://mslelearning.com/mslogo.png";
            e.currentTarget.className =
              "h-full w-full object-contain p-8 bg-brand/5 group-hover:scale-105 transition duration-300";
          }}
        />
      </div>
      <div className="p-4 space-y-2">
        {category ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            {category}
          </p>
        ) : null}
        <p className="font-display font-semibold text-msl-text line-clamp-2">{title}</p>
        <p className="text-sm text-msl-muted line-clamp-2">
          {(description || "Subscriber learning resource").substring(0, 100)}
          {(description || "").length > 100 ? "…" : ""}
        </p>
        {fileCount > 0 ? (
          <p className="text-xs text-msl-muted">
            {fileCount} {fileCount === 1 ? "asset" : "assets"}
          </p>
        ) : null}
        <Link
          className="inline-flex mt-2 text-sm text-brand font-semibold hover:underline"
          to={`/subscription/resource/${resource._id}`}
          state={{ resource, resourceTitle: title }}
        >
          Open resource →
        </Link>
      </div>
    </div>
  );
}
