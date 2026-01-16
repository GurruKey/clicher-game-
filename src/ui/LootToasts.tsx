import { useAppSelector } from "../app/hooks";
import { selectLootNotices } from "../state/lootNoticesSlice";

export default function LootToasts() {
  const lootNotices = useAppSelector(selectLootNotices);
  if (!lootNotices.length) return null;

  return (
    <div role="status" aria-live="polite" className="loot-toasts">
      {lootNotices.map((notice) => (
        <div
          key={notice.id}
          className={`loot-toast${notice.visible ? " loot-toast--show" : ""}`}
        >
          {notice.icon ? (
            <img src={notice.icon} alt="" draggable={false} />
          ) : null}
          <div className="loot-toast__text">
            <span className="loot-toast__label">{notice.label ?? "Found"}</span>
            <span className="loot-toast__name" data-rarity={notice.rarity ?? undefined}>
              {notice.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
