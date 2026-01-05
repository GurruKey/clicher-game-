import React from "react";

export default function LootToasts({ lootNotices }) {
  if (!lootNotices || lootNotices.length === 0) {
    return null;
  }

  return (
    <div className="loot-toasts" role="status" aria-live="polite">
      {lootNotices.map((notice) => (
        <div
          className={`loot-toast${notice.visible ? " loot-toast--show" : ""}`}
          key={notice.id}
        >
          {notice.icon ? <img src={notice.icon} alt="" draggable="false" /> : null}
          <div className="loot-toast__text">
            <span className="loot-toast__label">
              {notice.label ?? "Found"}
            </span>
            <span
              className="loot-toast__name"
              data-rarity={notice.rarity || undefined}
            >
              {notice.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
