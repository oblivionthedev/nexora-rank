import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleDollarSign, Sparkles } from "lucide-react";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free private-beta pricing and transparent planned plans for Nexora Rank.",
};

const plans = [
  {
    name: "Free",
    price: "€0",
    status: "Available in beta",
    description:
      "A complete starting workspace for a growing Roblox community.",
    features: [
      "1 workspace",
      "Connected accounts",
      "Core rank workflows",
      "Activity overview",
      "Applications",
      "30-day audit history",
    ],
  },
  {
    name: "Plus",
    price: "Not announced",
    status: "Planned",
    description:
      "Deeper controls for established teams. No checkout is active.",
    features: [
      "Advanced automations",
      "Longer audit history",
      "Custom branding",
      "Priority synchronization",
      "Advanced application rules",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "Not announced",
    status: "Planned",
    description: "Multi-workspace operations and developer tooling.",
    features: [
      "Multiple workspaces",
      "Developer API",
      "Advanced exports",
      "Higher automation limits",
      "Organization controls",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <LegalShell>
      <header className="pricing-header">
        <div className="section-kicker">
          <Sparkles className="size-3.5" /> Transparent private-beta pricing
        </div>
        <h1>
          Start at zero.
          <br />
          <span>Decide later.</span>
        </h1>
        <p>
          Nexora Rank is free while the production integrations are completed.
          Plus and Pro will not be sold until prices, checkout, cancellation,
          refunds, and legal operator details are published.
        </p>
      </header>
      <div className="pricing-page-grid">
        {plans.map((plan, index) => (
          <article key={plan.name} className={index === 0 ? "featured" : ""}>
            <div className="flex items-center justify-between">
              <h2>{plan.name}</h2>
              <span>{plan.status}</span>
            </div>
            <strong>{plan.price}</strong>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check className="size-3.5" />
                  {feature}
                </li>
              ))}
            </ul>
            {index === 0 ? (
              <Link href="/dashboard">
                Explore free demo <ArrowRight className="size-4" />
              </Link>
            ) : (
              <button disabled>Checkout not available</button>
            )}
          </article>
        ))}
      </div>
      <section className="pricing-note">
        <CircleDollarSign className="size-6" />
        <div>
          <h2>No surprise checkout.</h2>
          <p>
            Lemon Squeezy is the planned merchant of record, but it is not
            connected. Prices will be announced only after the legal owner and
            payout account are eligible and verified.
          </p>
        </div>
        <Link href="/legal/refunds">
          Refund policy <ArrowRight className="size-4" />
        </Link>
      </section>
    </LegalShell>
  );
}
