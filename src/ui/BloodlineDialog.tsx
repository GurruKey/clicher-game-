import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAvatarMetaFromRoot } from "../state/avatarSelectors";
import { closeBloodline } from "../state/uiSlice";
import ModalShell from "./ModalShell";
import { buildStatDetails } from "../content/stats/index.js";

type StatDetail = { id: string; label: string; value: string };

const DEFAULT_DETAILS: StatDetail[] = (buildStatDetails as any)(null, 3) as StatDetail[];

const ensureDetails = (value: unknown): StatDetail[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is StatDetail =>
        Boolean(v) &&
        typeof (v as any).id === "string" &&
        typeof (v as any).label === "string" &&
        typeof (v as any).value === "string"
    );
  }
  if (value && typeof value === "object") {
    return (buildStatDetails as any)(value, 0) as StatDetail[];
  }
  return DEFAULT_DETAILS;
};

function RowButton(props: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="stats-dialog__row stats-dialog__row--button"
    >
      <span>{props.label}</span>
      <span className="stats-dialog__value">{props.value}</span>
    </button>
  );
}

function DetailList(props: { details: StatDetail[] }) {
  const details = props.details.filter((d) => {
    const num = Number(d.value);
    return !Number.isFinite(num) || num !== 0;
  });

  return (
    <div className="stats-dialog__details">
      {details.length > 0 ? (
        details.map((d) => (
        <div key={d.id} className="stats-dialog__detail">
          <span className="stats-dialog__detail-label">{d.label}</span>
          <span className="stats-dialog__detail-value">{d.value}</span>
        </div>
        ))
      ) : (
        <div className="dialog__hint">No bonuses</div>
      )}
    </div>
  );
}

export default function BloodlineDialog() {
  const dispatch = useAppDispatch();
  const avatarMeta = useAppSelector(selectAvatarMetaFromRoot) as any;
  const [isRaceOpen, setIsRaceOpen] = useState(false);
  const [isSubraceOpen, setIsSubraceOpen] = useState(false);
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isFactionOpen, setIsFactionOpen] = useState(false);

  const info = useMemo(() => {
    return {
      race: avatarMeta?.race ?? "Human",
      raceLevel: avatarMeta?.raceLevel ?? 1,
      subrace: avatarMeta?.subrace ?? "Common",
      subraceLevel: avatarMeta?.subraceLevel ?? 1,
      gender: avatarMeta?.gender ?? "Male",
      origin: avatarMeta?.origin ?? "Unknown",
      originLevel: avatarMeta?.originLevel ?? 1,
      faction: avatarMeta?.faction ?? "Neutral",
      factionLevel: avatarMeta?.factionLevel ?? 1,
      raceStats: ensureDetails(avatarMeta?.raceStats),
      subraceStats: ensureDetails(avatarMeta?.subraceStats),
      originStats: ensureDetails(avatarMeta?.originStats),
      factionStats: ensureDetails(avatarMeta?.factionStats)
    };
  }, [avatarMeta]);

  return (
    <ModalShell title="Bloodline" onClose={() => dispatch(closeBloodline())} dialogClassName="stats-dialog">
      <div className="stats-dialog__body">
        <RowButton
          label="Race"
          value={`${String(info.race)} (Level ${String(info.raceLevel)})`}
          onClick={() => setIsRaceOpen((p) => !p)}
        />
        {isRaceOpen ? <DetailList details={info.raceStats} /> : null}

        <RowButton
          label="Subrace"
          value={`${String(info.subrace)} (Level ${String(info.subraceLevel)})`}
          onClick={() => setIsSubraceOpen((p) => !p)}
        />
        {isSubraceOpen ? <DetailList details={info.subraceStats} /> : null}
        <div className="stats-dialog__row">
          <span>Gender</span>
          <span className="stats-dialog__value">{String(info.gender)}</span>
        </div>

        <RowButton
          label="Origin"
          value={`${String(info.origin)} (Level ${String(info.originLevel)})`}
          onClick={() => setIsOriginOpen((p) => !p)}
        />
        {isOriginOpen ? <DetailList details={info.originStats} /> : null}

        <RowButton
          label="Faction"
          value={`${String(info.faction)} (Level ${String(info.factionLevel)})`}
          onClick={() => setIsFactionOpen((p) => !p)}
        />
        {isFactionOpen ? <DetailList details={info.factionStats} /> : null}
      </div>
    </ModalShell>
  );
}
