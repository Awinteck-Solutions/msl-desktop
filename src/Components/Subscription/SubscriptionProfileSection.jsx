import { Link } from "react-router-dom";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  cancelSubscription,
  fetchSubscriptionPlan,
  fetchSubscriptionStatus,
} from "../../Services/SubscriptionApi";
import {
  formatSubscriptionDate,
  subscriptionStatusLabel,
} from "../../utils/subscriptionDisplay";
import SubscriptionPlanList from "./SubscriptionPlanList";

export default function SubscriptionProfileSection() {
  const toast = useToast();
  const cancelModal = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [planRes, statusRes] = await Promise.all([
      fetchSubscriptionPlan(),
      fetchSubscriptionStatus(),
    ]);
    if (planRes.ok) setPlan(planRes.plan);
    if (statusRes.ok) setStatusData(statusRes.data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const sub = statusData?.subscription;
  const hasAccess = Boolean(statusData?.hasAccess);
  const canSubscribe = statusData?.canSubscribe !== false;
  const plansOpen = Boolean((plan?.plans || []).length || plan?.name);

  const onCancel = async () => {
    setCancelling(true);
    const result = await cancelSubscription();
    setCancelling(false);
    cancelModal.onClose();
    if (result.ok) {
      toast({ title: result.message, status: "success", duration: 5000 });
      reload();
    } else {
      toast({ title: result.message, status: "error", duration: 5000 });
    }
  };

  return (
    <section className="glass-card p-6 border border-msl-border/50">
      <div className="flex items-start gap-3 mb-4">
        <span className="rounded-xl bg-brand/10 p-2 text-brand">
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-msl-text">
            AI subscription
          </h2>
          <p className="text-sm text-msl-muted mt-0.5">
            Plan, billing period, and subscriber access
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner color="brand.500" />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-msl-text mb-3">MSL AI plans</p>
            {plan?.description ? (
              <p className="text-sm text-msl-muted mb-3">{plan.description}</p>
            ) : null}
            {plansOpen ? (
              <SubscriptionPlanList plan={plan} />
            ) : (
              <p className="text-sm text-msl-muted">The AI subscription plans are not available yet.</p>
            )}
            {plan ? (
              <p className="mt-3 text-xs text-msl-muted">
                Daily AI limit {plan.dailyAiLimit ?? "—"} · Monthly AI limit {plan.monthlyAiLimit ?? "—"}
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  hasAccess
                    ? "bg-msl-success/15 text-msl-success"
                    : "bg-msl-muted/15 text-msl-muted"
                }`}
              >
                {hasAccess ? "Active access" : "No active subscription"}
              </span>
              {sub?.status ? (
                <span className="text-xs text-msl-muted">
                  Status: {subscriptionStatusLabel(sub.status)}
                </span>
              ) : null}
            </div>

            {hasAccess && sub ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-msl-muted">Current period ends</dt>
                  <dd className="font-medium">
                    {formatSubscriptionDate(sub.currentPeriodEnd)}
                  </dd>
                </div>
                {sub.gracePeriodEndsAt ? (
                  <div>
                    <dt className="text-msl-muted">Grace period ends</dt>
                    <dd className="font-medium">
                      {formatSubscriptionDate(sub.gracePeriodEndsAt)}
                    </dd>
                  </div>
                ) : null}
                {sub.cancelAtPeriodEnd ? (
                  <div className="sm:col-span-2 text-amber-600 dark:text-amber-400 text-sm">
                    Cancellation scheduled — access continues until the period ends.
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-msl-muted">
                {canSubscribe
                  ? "Subscribe with the mobile app, then return here to use subscriber AI and resources."
                  : "Course enrollment may already include AI features."}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {hasAccess ? (
                <Button as={Link} to="/subscription" size="sm" colorScheme="brand">
                  Browse resources
                </Button>
              ) : null}
              {hasAccess && sub && !sub.cancelAtPeriodEnd ? (
                <Button size="sm" variant="outline" colorScheme="red" onClick={cancelModal.onOpen}>
                  Cancel at period end
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={cancelModal.isOpen} onClose={cancelModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel subscription?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Your AI access will stay active until the end of the current billing period.
            You can subscribe again later from the mobile app.
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={cancelModal.onClose}>
              Keep subscription
            </Button>
            <Button colorScheme="red" isLoading={cancelling} onClick={onCancel}>
              Confirm cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
