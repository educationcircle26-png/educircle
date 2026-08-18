"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AREAS = [
  "New Cairo",
  "Maadi",
  "6th October",
  "Zayed",
  "Anywhere in Egypt",
  "Outside Egypt",
];

const YEARS = [
  "Nursery",
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7+",
];

const CURRICULA = ["British", "American", "IB", "National", "Not sure yet"];

const PRIORITIES = [
  "Academic level",
  "English",
  "Sports",
  "Arts",
  "Student wellbeing",
  "SEN support",
  "Class size",
  "University preparation",
  "Location",
];

const MAX_PRIORITIES = 5;

const SITUATIONS = [
  "My child is starting school",
  "I'm considering changing schools",
  "We're moving to Egypt",
  "We're moving within Egypt",
  "I'm just exploring",
];

type Answers = {
  areas: string[];
  year: string;
  curricula: string[];
  priorities: string[];
  situation: string;
};

function toggle(list: string[], value: string, max?: number) {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (max && list.length >= max) return list;
  return [...list, value];
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
        selected
          ? "border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-600"
          : "border-neutral-300 text-neutral-800 hover:border-neutral-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    areas: [],
    year: "",
    curricula: [],
    priorities: [],
    situation: "",
  });

  const canContinue =
    (step === 1 && answers.areas.length > 0) ||
    (step === 2 && answers.year !== "") ||
    (step === 3 && answers.curricula.length > 0) ||
    (step === 4 && answers.priorities.length > 0) ||
    (step === 5 && answers.situation !== "");

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ search_preferences: answers })
      .eq("id", userId);
    setSaving(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✅
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">
          You&apos;re all set!
        </h1>
        <p className="text-sm text-neutral-600">
          We saved your preferences. Once schools and parent conversations
          are live, we&apos;ll show you the ones that match.
        </p>
        <a
          href="/network"
          className="mt-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700"
        >
          Explore the Parent Network
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="text-neutral-500"
            aria-label="Back"
          >
            ←
          </button>
        )}
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-violet-600" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-neutral-500">{step} of 5</span>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              1. Where are you looking?
            </h1>
            <p className="text-sm text-neutral-500">
              You can select more than one area.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {AREAS.map((area) => (
              <Chip
                key={area}
                label={area}
                selected={answers.areas.includes(area)}
                onClick={() =>
                  setAnswers((a) => ({
                    ...a,
                    areas: toggle(a.areas, area),
                  }))
                }
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              2. Which year will your child enter?
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {YEARS.map((year) => (
              <Chip
                key={year}
                label={year}
                selected={answers.year === year}
                onClick={() => setAnswers((a) => ({ ...a, year }))}
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              3. What curriculum are you considering?
            </h1>
            <p className="text-sm text-neutral-500">Select all that apply.</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {CURRICULA.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={answers.curricula.includes(c)}
                onClick={() =>
                  setAnswers((a) => ({
                    ...a,
                    curricula: toggle(a.curricula, c),
                  }))
                }
              />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              4. What matters most to you?
            </h1>
            <p className="text-sm text-neutral-500">
              Select up to {MAX_PRIORITIES}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={answers.priorities.includes(p)}
                onClick={() =>
                  setAnswers((a) => ({
                    ...a,
                    priorities: toggle(a.priorities, p, MAX_PRIORITIES),
                  }))
                }
              />
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              5. What&apos;s your situation?
            </h1>
            <p className="text-sm text-neutral-500">
              This helps us show you the most relevant conversations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SITUATIONS.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={answers.situation === s}
                onClick={() => setAnswers((a) => ({ ...a, situation: s }))}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canContinue || saving}
        onClick={() => (step < 5 ? setStep(step + 1) : finish())}
        className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-40"
      >
        {step < 5 ? "Continue" : saving ? "Saving..." : "Find parents & schools"}
      </button>
    </div>
  );
}
