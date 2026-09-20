"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/design-system/primitives";

const commodities = [
  "Iron Ore",
  "Coal",
  "Grain",
  "Fertilizer",
  "Bauxite",
  "Manganese",
  "Steel",
  "Petcoke",
  "Sugar",
];
const origins = [
  "Australia (Port Hedland)",
  "US (New Orleans)",
  "Mozambique (Beira)",
  "Russia (Vladivostok)",
  "Indonesia (Tanjung Api-Api)",
];
const destinations = [
  "Paradip",
  "Visakhapatnam",
  "Gangavaram",
  "Gopalpur",
  "Dhamra",
  "Sagar/Sandheads",
  "Haldia",
];

interface FormData {
  quantity: string;
  commodity: string;
  origin: string;
  destination: string;
  loadingPeriod: string;
  contractDuration: string;
}

interface FormErrors {
  quantity?: string;
  commodity?: string;
  origin?: string;
  destination?: string;
}

export function AnalyzeCargoForm() {
  const [form, setForm] = useState<FormData>({
    quantity: "",
    commodity: "",
    origin: "",
    destination: "",
    loadingPeriod: "",
    contractDuration: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.quantity || Number(form.quantity) <= 0)
      e.quantity = "Enter valid quantity (tonnes)";
    if (!form.commodity) e.commodity = "Select a commodity";
    if (!form.origin) e.origin = "Select origin port";
    if (!form.destination) e.destination = "Select destination";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Panel>
        <div className="p-6 text-center">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(16, 185, 129, 0.1)" }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--color-positive)"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p
            className="text-[13px] font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Analysis request submitted
          </p>
          <p
            className="text-[11px] mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {Number(form.quantity).toLocaleString()}t {form.commodity} —{" "}
            {form.origin.split(" (")[0]} → {form.destination}
          </p>
          <p
            className="text-[10px] mt-2"
            style={{ color: "var(--color-text-dim)" }}
          >
            Full analysis engine available in Phase 3
          </p>
          <button
            className="btn-ghost mt-4 text-[11px]"
            onClick={() => {
              setSubmitted(false);
              setForm({
                quantity: "",
                commodity: "",
                origin: "",
                destination: "",
                loadingPeriod: "",
                contractDuration: "",
              });
            }}
          >
            New Analysis
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Analyze New Cargo
        </h3>
      </PanelHeader>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity (tonnes)" error={errors.quantity}>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                className="input-field"
              />
            </Field>
            <Field label="Commodity" error={errors.commodity}>
              <select
                value={form.commodity}
                onChange={(e) =>
                  setForm({ ...form, commodity: e.target.value })
                }
                className="select-field"
              >
                <option value="">Select</option>
                {commodities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Origin" error={errors.origin}>
              <select
                value={form.origin}
                onChange={(e) =>
                  setForm({ ...form, origin: e.target.value })
                }
                className="select-field"
              >
                <option value="">Select origin</option>
                {origins.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination" error={errors.destination}>
              <select
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                className="select-field"
              >
                <option value="">Select destination</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preferred Loading Period">
              <input
                type="text"
                placeholder="e.g. Sep 15–25, 2026"
                value={form.loadingPeriod}
                onChange={(e) =>
                  setForm({ ...form, loadingPeriod: e.target.value })
                }
                className="input-field"
              />
            </Field>
            <Field label="Contract Duration">
              <select
                value={form.contractDuration}
                onChange={(e) =>
                  setForm({ ...form, contractDuration: e.target.value })
                }
                className="select-field"
              >
                <option value="">Select</option>
                <option value="spot">Spot (single voyage)</option>
                <option value="3mo">3-month time charter</option>
                <option value="6mo">6-month time charter</option>
                <option value="12mo">12-month time charter</option>
              </select>
            </Field>
          </div>
          <button type="submit" className="btn-primary w-full">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
            Analyze Cargo →
          </button>
        </form>
      </div>
    </Panel>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="text-[10px] font-medium uppercase tracking-wider mb-1 block"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
