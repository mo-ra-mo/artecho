"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

export default function BillingPage() {
  const [success, setSuccess] = useState(false);
  const [canceled, setCanceled] = useState(false);

  const [loading, setLoading] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [walletBalanceCents, setWalletBalanceCents] = useState(0);
  const [topupAmount, setTopupAmount] = useState("1000");
  const [plans, setPlans] = useState(DEFAULT_SITE_SETTINGS.plans);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetch("/api/site-settings"), fetch("/api/user/progress"), fetch("/api/wallet")])
      .then(async ([settingsRes, progressRes, walletRes]) => {
        const [settingsData, progressData, walletData] = await Promise.all([
          settingsRes.ok ? settingsRes.json() : null,
          progressRes.ok ? progressRes.json() : null,
          walletRes.ok ? walletRes.json() : null,
        ]);
        if (!mounted) return;
        if (Array.isArray(settingsData?.settings?.plans) && settingsData.settings.plans.length) {
          setPlans(settingsData.settings.plans);
        }
        if (!progressData?.error && progressData?.plan) {
          setCurrentPlan(progressData.plan);
        }
        if (!walletData?.error) {
          setWalletBalanceCents(Number(walletData?.balanceCents || 0));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSuccess(params.get("success") === "true");
    setCanceled(params.get("canceled") === "true");
  }, []);

  const handleUpgrade = async (tier) => {
    if (tier === "FREE" || tier === currentPlan) return;
    setLoading(tier);

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleTopup = async () => {
    const amountCents = Number(topupAmount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      alert("Enter a valid top-up amount in cents.");
      return;
    }
    setLoading("WALLET_TOPUP");
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create top-up session.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-50 pt-20 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-800">
              Plans & Billing
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Choose the plan that fits your creative journey. Upgrade or
              downgrade anytime.
            </p>
          </div>

          {/* Alerts */}
          {success && (
            <div className="mb-6 mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              <span className="font-semibold">Payment successful!</span> Your
              plan has been upgraded.
            </div>
          )}
          {canceled && (
            <div className="mb-6 mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
              Checkout was canceled. You can try again anytime.
            </div>
          )}

          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Wallet
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  ${(walletBalanceCents / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="h-10 w-32 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
                  placeholder="cents"
                />
                <button
                  type="button"
                  onClick={handleTopup}
                  disabled={loading === "WALLET_TOPUP"}
                  className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading === "WALLET_TOPUP" ? "Redirecting..." : "Top up wallet"}
                </button>
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => {
              const isActive = plan.tier === currentPlan;
              return (
                <div
                  key={plan.tier}
                  className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 shadow-sm transition hover:shadow-md ${plan.color || "border-slate-200"} ${
                    isActive ? "ring-2 ring-teal-400/40" : ""
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      {plan.badge}
                    </span>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      {plan.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {plan.description || "Custom plan"}
                    </p>
                  </div>

                  <div className="mb-5">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-400">
                      {plan.period || "/month"}
                    </span>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2">
                    {(Array.isArray(plan.features) ? plan.features : []).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <svg
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isActive || loading === plan.tier}
                    onClick={() => handleUpgrade(plan.tier)}
                    className={`h-10 w-full rounded-xl text-sm font-semibold transition cursor-pointer disabled:cursor-not-allowed ${
                      isActive
                        ? "bg-slate-100 text-slate-400"
                        : plan.tier === "PRO"
                          ? "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                          : plan.tier === "PRO_PLUS"
                            ? "bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50"
                            : plan.tier === "CREATOR"
                              ? "bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
                              : "bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                    }`}
                  >
                    {loading === plan.tier ? (
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="h-3.5 w-3.5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Redirecting...
                      </span>
                    ) : isActive ? (
                      "Current Plan"
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ / Info */}
          <div className="mt-12 mx-auto max-w-2xl text-center">
            <h2 className="text-lg font-bold text-slate-700 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 text-left">
              {[
                {
                  q: "Can I switch plans anytime?",
                  a: "Yes. Upgrading takes effect immediately. Downgrading takes effect at the end of your current billing cycle.",
                },
                {
                  q: "Is there a free trial?",
                  a: "The Free plan is permanent — no credit card required. You can upgrade whenever you're ready.",
                },
                {
                  q: "What payment methods are accepted?",
                  a: "We accept all major credit/debit cards, Apple Pay, and Google Pay through Stripe.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely. Cancel from this page and your plan will remain active until the end of the billing period.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-700">
                    {faq.q}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{faq.a}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs text-slate-400">
              Need help?{" "}
              <Link
                href="/about"
                className="text-teal-600 hover:underline font-medium"
              >
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
