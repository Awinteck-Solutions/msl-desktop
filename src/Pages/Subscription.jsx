import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Spinner } from "@chakra-ui/react";
import { Sparkles } from "lucide-react";
import AppShell from "../Components/Layout/AppShell";
import SubscriptionResourceCard from "../Components/Subscription/SubscriptionResourceCard";
import { CourseCardSkeleton } from "../Components/UI/Skeleton";
import { getStoredUser } from "../Services/session";
import {
  fetchSubscriptionResources,
  fetchSubscriptionStatus,
} from "../Services/SubscriptionApi";
import { matchesSearch } from "../utils/practiceSearch";

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/login");
      return;
    }
    (async () => {
      setLoading(true);
      const statusRes = await fetchSubscriptionStatus();
      const access = Boolean(statusRes.ok && statusRes.data?.hasAccess);
      setHasAccess(access);
      if (access) {
        const res = await fetchSubscriptionResources();
        if (res.ok) setResources(res.items || []);
        else setResources([]);
      } else {
        setResources([]);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const filtered = useMemo(
    () =>
      resources.filter((item) =>
        matchesSearch(
          search,
          item.title,
          item.description,
          item.categoryId?.name
        )
      ),
    [resources, search]
  );

  return (
    <AppShell
      active={{ subscription: true }}
      title="Subscriber resources"
      subtitle="Browse learning materials included with your AI subscription"
      headerRight={
        <input
          type="text"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-msl border border-msl-border bg-msl-surface px-4 py-2 text-sm text-msl-text placeholder:text-msl-muted focus:outline-none focus:border-msl-primary/50 w-56"
        />
      }
    >
      {loading ? (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : !hasAccess ? (
        <div className="max-w-xl msl-card p-8">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-brand/10 p-2 text-brand">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-msl-text">
                Subscription required
              </p>
              <p className="text-sm text-msl-muted mt-2">
                Subscribe on the mobile app to unlock this library. Plan
                details and billing status are on your profile.
              </p>
              <Button as={Link} to="/profile" mt={4} size="sm" colorScheme="brand">
                Go to profile
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filtered.length ? (
            filtered.map((item) => (
              <SubscriptionResourceCard key={item._id} resource={item} />
            ))
          ) : (
            <div className="msl-card p-12 w-full text-center">
              <p className="text-lg font-medium text-msl-text">
                {resources.length ? "No resources match your search" : "No resources yet"}
              </p>
              <p className="text-sm text-msl-muted mt-2">
                {resources.length
                  ? "Try a different keyword."
                  : "New subscriber content will appear here when published."}
              </p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
