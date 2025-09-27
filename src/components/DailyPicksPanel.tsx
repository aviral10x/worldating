"use client";

import { useState, useCallback } from "react";
import { DailyPicksRefresh } from "./DailyPicksRefresh";
import { DailyPicksList } from "./DailyPicksList";

export const DailyPicksPanel = ({ userId = 1, take = 4 }: { userId?: number; take?: number }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAfterRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="soft-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Daily Picks</div>
          <p className="text-sm text-[var(--muted-foreground)]">Handpicked profiles based on your interests</p>
        </div>
        <DailyPicksRefresh userId={userId} onAfterRefresh={handleAfterRefresh} />
      </div>
      <DailyPicksList userId={userId} take={take} refreshKey={refreshKey} />
    </div>
  );
};