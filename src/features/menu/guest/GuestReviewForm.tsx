"use client";

import { useState } from "react";
import { Star, Check } from "lucide-react";
import Button from "@/components/ui/Button";

export interface GuestReviewLabels {
  reviewTitle: string;
  reviewCommentPlaceholder: string;
  reviewSubmit: string;
  reviewThanks: string;
}

// Optional post-order feedback: 1–5 stars plus a comment. Self-contained — the
// guest may simply ignore it. Once submitted it collapses to a thank-you note.
export function GuestReviewForm({
  hotelSlug,
  orderId,
  room,
  labels,
}: {
  hotelSlug: string;
  orderId: string;
  room: string;
  labels: GuestReviewLabels;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/menu/guest/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel: hotelSlug, orderId, room, rating, comment }),
      });
      if (res.ok) setDone(true);
    } catch {
      /* best-effort; leave the form so the guest can retry */
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-(--surface-border) bg-(--surface-card) p-3.5 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
          <Check size={16} />
        </span>
        <p className="text-[0.9rem] font-semibold text-(--gray-700) m-0">
          {labels.reviewThanks}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-(--surface-border) bg-(--surface-card) p-3.5 flex flex-col gap-3">
      <h4 className="text-[0.85rem] font-bold text-(--gray-700) m-0">
        {labels.reviewTitle}
      </h4>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n}`}
            className="p-0.5"
          >
            <Star
              size={26}
              className={
                n <= (hover || rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-(--gray-300)"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        className="w-full px-3 py-2 min-h-16 resize-y rounded-lg text-sm outline-none bg-(--surface-bg) border border-(--surface-border) text-(--gray-800) focus:border-(--brand-500) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={labels.reviewCommentPlaceholder}
      />
      <Button
        className="w-full justify-center"
        disabled={rating < 1}
        loading={submitting}
        onClick={submit}
      >
        {labels.reviewSubmit}
      </Button>
    </div>
  );
}
