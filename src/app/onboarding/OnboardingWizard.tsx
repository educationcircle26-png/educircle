"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

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

type School = { id: string; name: string };

const TOTAL_STEPS = 6;

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
      aria-pressed={selected}
      className={`rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
        selected
          ? "border-violet-500 bg-violet-50 text-violet-700 shadow-[0_0_0_1px_rgb(139_92_246)]"
          : "border-neutral-200 text-slate-700 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm"
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingWizard({
  userId,
  schools,
}: {
  userId: string;
  schools: School[];
}) {
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
  const [child, setChild] = useState({
    first_name: "",
    school_id: "",
    academic_year: "",
  });

  const canContinue =
    (step === 1 && answers.areas.length > 0) ||
    (step === 2 && answers.year !== "") ||
    (step === 3 && answers.curricula.length > 0) ||
    (step === 4 && answers.priorities.length > 0) ||
    (step === 5 && answers.situation !== "") ||
    step === 6;

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ search_preferences: answers })
      .eq("id", userId);
    if (child.first_name.trim()) {
      await supabase.from("children").insert({
        parent_id: userId,
        first_name: child.first_name.trim(),
        school_id: child.school_id || null,
        academic_year: child.academic_year.trim() || null,
      });
    }
    setSaving(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Logo className="mb-2 justify-center" />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✅
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          You&apos;re all set!
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          We saved your preferences. We&apos;ll use them to surface the
          schools and conversations that match.
        </p>
        <a
          href="/"
          className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
        >
          Explore EduCircle
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Logo className="justify-center" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition enabled:hover:bg-neutral-100 enabled:hover:text-slate-700 disabled:opacity-0"
          aria-label="Back"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-violet-600" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>

        <span className="shrink-0 text-xs font-medium text-slate-400">
          {step} of {TOTAL_STEPS}
        </span>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              1. Where are you looking?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
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
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
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
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              3. What curriculum are you considering?
            </h1>
            <p className="mt-1 text-sm text-slate-500">Select all that apply.</p>
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
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              4. What matters most to you?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
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
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              5. What&apos;s your situation?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
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

      {step === 6 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              6. Add your child (optional)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              This connects you to their school&apos;s community. You can
              skip this and add it later from your profile.
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              First name
            </label>
            <input
              value={child.first_name}
              onChange={(e) =>
                setChild((c) => ({ ...c, first_name: e.target.value }))
              }
              placeholder="Omar"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              School
            </label>
            <select
              value={child.school_id}
              onChange={(e) =>
                setChild((c) => ({ ...c, school_id: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Not listed / not decided yet</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Year / grade
            </label>
            <input
              value={child.academic_year}
              onChange={(e) =>
                setChild((c) => ({ ...c, academic_year: e.target.value }))
              }
              placeholder={answers.year || "Year 2"}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canContinue || saving}
        onClick={() => {
          if (step === 5) {
            setChild((c) => ({
              ...c,
              academic_year: c.academic_year || answers.year,
            }));
          }
          step < TOTAL_STEPS ? setStep(step + 1) : finish();
        }}
        className="rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-violet-600"
      >
        {step < TOTAL_STEPS
          ? "Continue"
          : saving
            ? "Saving..."
            : child.first_name.trim()
              ? "Add child & finish"
              : "Skip & finish"}
      </button>
    </div>
  );
}
