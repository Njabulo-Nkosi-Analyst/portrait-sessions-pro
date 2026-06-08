import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { QuoteCalculator } from "@/components/QuoteCalculator";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Instant Quote — Trope Photography" },
      { name: "description", content: "Build your photography quote in seconds — no waiting, no email required." },
      { property: "og:title", content: "Instant Quote — Trope Photography" },
      { property: "og:description", content: "Build your photography quote in seconds — no waiting, no email required." },
    ],
  }),
  component: () => <Layout><QuoteCalculator /></Layout>,
});
