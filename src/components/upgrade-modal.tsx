import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getUserSession, setUserSession, isUserPremium, UserSession } from "@/lib/session";
import { InvoiceModal, type InvoiceData } from "@/components/invoice-modal";
import {
  Sparkles,
  CheckCircle2,
  Zap,
  FolderKanban,
  Map,
  ShieldCheck,
  Loader2,
  Crown,
  ArrowRight,
  Check,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type UpgradeReason = "projects" | "ai-assist" | "roadmap" | "general";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: UpgradeReason;
  onSuccess?: () => void;
}

const PLANS = [
  {
    id: "annual",
    name: "Annual Scholar Pro",
    duration: "1 Year Access",
    price: 499,
    originalPrice: 1299,
    discountBadge: "Save 62% • Best Value",
    perMonth: "₹41/month",
    popular: true,
  },
  {
    id: "monthly",
    name: "Monthly Pro",
    duration: "1 Month Access",
    price: 199,
    originalPrice: 299,
    discountBadge: null,
    perMonth: "₹199/month",
    popular: false,
  },
];

export function UpgradeModal({
  open,
  onOpenChange,
  reason = "general",
  onSuccess,
}: UpgradeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("annual");
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceData | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK");
    };
    document.body.appendChild(script);

    return () => {
      // Keep script in body for reuse
    };
  }, []);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];

  const handleUpgrade = async () => {
    const session = getUserSession();
    if (!session || !session.email) {
      toast.error("Please sign in to upgrade to Scholar Pro.");
      return;
    }

    if (!razorpayReady && !window.Razorpay) {
      toast.error("Payment gateway is initializing. Please try again in a moment.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay Order on Backend
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.email,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amountInRupees: selectedPlan.price,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initiate payment order with Razorpay.");
      }

      const { orderId, amount, currency, keyId } = orderData;

      // 2. Open Official Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "ScholarNexus Pro",
        description: `Upgrade to ${selectedPlan.name}`,
        image: "/favicon.ico",
        order_id: orderId,
        prefill: {
          name: session.name || session.displayName || "Researcher",
          email: session.email,
          contact: session.phone || "",
        },
        theme: {
          color: "#059669", // Emerald primary accent
          backdrop_color: "#090d16",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled / closed.");
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/payments/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: session.email,
                planId: selectedPlan.id,
                planName: selectedPlan.name,
                razorpay_order_id: response.razorpay_order_id || orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              const updatedSession: UserSession = {
                ...session,
                ...(verifyData.user || {}),
                isPremium: true,
                premiumPlan: selectedPlan.name,
                premiumSince: new Date().toISOString(),
              };

              setUserSession(updatedSession);

              if (verifyData.invoice) {
                setCompletedInvoice(verifyData.invoice);
                setShowInvoiceModal(true);
              }

              toast.success("🎉 Welcome to Scholar Pro! Payment verified and features unlocked.", {
                duration: 6000,
              });

              onOpenChange(false);
              if (onSuccess) onSuccess();
            } else {
              toast.error(verifyData.error || "Payment verification failed.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            toast.error("Failed to verify payment with server.");
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Razorpay payment failed:", response);
        toast.error(
          response.error?.description || "Payment failed. Please try another card or payment method."
        );
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to connect to Razorpay.");
      setLoading(false);
    }
  };

  const handleResetToFree = async () => {
    const session = getUserSession();
    if (!session || !session.email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/reset-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedSession: UserSession = {
          ...session,
          isPremium: false,
          premiumPlan: undefined,
          premiumSince: undefined,
          razorpayPaymentId: undefined,
          razorpayOrderId: undefined,
        };
        setUserSession(updatedSession);
        toast.success("Account switched back to Free Tier.");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.error || "Failed to reset plan.");
      }
    } catch (e: any) {
      toast.error(e.message || "Error resetting plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl">
        {/* Glow Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/25 via-emerald-600/15 to-transparent p-6 sm:p-8 border-b border-border/60">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
                  <Crown className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div>
                  <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/40 text-[0.68rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Scholar Pro Tier
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    Unlock Unlimited Research Power
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg pt-1">
              Elevate your academic workflow with unrestricted project capacity, Gemini AI section writing assistance, and automated research roadmaps.
            </p>

            {/* Contextual Reason Callout */}
            {reason !== "general" && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-xs text-primary font-medium">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {reason === "projects" && "You reached the 3-project free limit. Upgrade for unlimited projects."}
                  {reason === "ai-assist" && "AI Section Assist writing companion is a Scholar Pro feature."}
                  {reason === "roadmap" && "AI Research Roadmap Generator is a Scholar Pro feature."}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* The 3 Core Gated Features */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Exclusive Pro Benefits
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Feature 1 */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  reason === "projects"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/80 bg-background/60 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 text-primary mb-1.5">
                  <div className="p-1.5 rounded-lg bg-primary/15">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Unlimited Projects</span>
                </div>
                <p className="text-[0.72rem] text-muted-foreground leading-snug">
                  Break past the 3-project limit. Manage unlimited academic & thesis workspaces.
                </p>
              </div>

              {/* Feature 2 */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  reason === "ai-assist"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/80 bg-background/60 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 text-primary mb-1.5">
                  <div className="p-1.5 rounded-lg bg-primary/15">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs text-foreground">AI Assist Section</span>
                </div>
                <p className="text-[0.72rem] text-muted-foreground leading-snug">
                  Contextual academic drafting, tone refinement, and synthesis directly inside each section.
                </p>
              </div>

              {/* Feature 3 */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  reason === "roadmap"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/80 bg-background/60 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 text-primary mb-1.5">
                  <div className="p-1.5 rounded-lg bg-primary/15">
                    <Map className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs text-foreground">AI Roadmap Generator</span>
                </div>
                <p className="text-[0.72rem] text-muted-foreground leading-snug">
                  Automated week-by-week research milestone generator synced to project tasks.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Selector Cards */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Select Your Plan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border/70 bg-background/40 hover:border-border"
                    }`}
                  >
                    {plan.discountBadge && (
                      <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white font-bold text-[0.62rem] px-2 py-0.5 rounded-full shadow-sm">
                        {plan.discountBadge}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{plan.name}</h4>
                        <p className="text-[0.7rem] text-muted-foreground">{plan.duration}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-foreground">₹{plan.price}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{plan.originalPrice}</span>
                      <span className="text-[0.7rem] text-primary font-medium ml-auto">{plan.perMonth}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA & Security Notice */}
          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              disabled={loading}
              onClick={handleUpgrade}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary via-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-primary/20 gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting to Razorpay...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current" /> Pay with Razorpay • ₹{selectedPlan.price} ({selectedPlan.duration})
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>

            {isUserPremium(getUserSession()) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={handleResetToFree}
                className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Switch Account Back to Free Tier
              </Button>
            )}

            <div className="flex items-center justify-center gap-3 text-[0.68rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Razorpay Test Gateway
              </span>
              <span>•</span>
              <span>Instant Activation</span>
              <span>•</span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <InvoiceModal
      open={showInvoiceModal}
      onOpenChange={setShowInvoiceModal}
      invoice={completedInvoice}
    />
    </>
  );
}
