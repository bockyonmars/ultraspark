"use client";

import type { CustomerActivity } from "@/types/api";
import { formatDateTime, toTitleCase } from "@/lib/utils";

type CustomerActivityTimelineProps = {
  activity?: CustomerActivity[];
};

export function CustomerActivityTimeline({
  activity = [],
}: CustomerActivityTimelineProps) {
  if (!activity.length) {
    return (
      <div className="rounded-xl border bg-white p-5 text-sm text-slate-500">
        No customer activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold text-slate-900">Activity timeline</h2>
      <ol className="mt-4 space-y-4">
        {activity.map((item) => (
          <li key={item.id} className="relative border-l border-border pl-4">
            <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
            <p className="font-medium text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {toTitleCase(item.type)} - {formatDateTime(item.createdAt)}
            </p>
            {item.description ? (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
