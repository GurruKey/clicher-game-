import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { resetProgress } from "../state/gameThunks";
import { closeSettings, openKeybinds } from "../state/uiSlice";
import { selectGraphics, setGraphicsResolution } from "../state/settingsSlice";
import ModalShell from "./ModalShell";

type ResolutionOption = {
  width: number;
  height: number;
  label: string;
};

const getAspect = (width: number, height: number) => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) return 1;
  return width / height;
};

export default function SettingsDialog() {
  const dispatch = useAppDispatch();
  const graphics = useAppSelector(selectGraphics);
  const [activeTab, setActiveTab] = useState<"general" | "graphics">("general");
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const resolutionRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document === "undefined") return false;
    const doc = document as any;
    return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
  });

  const resolutionOptions: ResolutionOption[] = useMemo(
    () => [
      { width: 1024, height: 768, label: "1024x768 (4:3)" },
      { width: 1280, height: 720, label: "1280x720 (16:9)" },
      { width: 1280, height: 800, label: "1280x800 (16:10)" },
      { width: 1366, height: 768, label: "1366x768 (16:9)" },
      { width: 1440, height: 900, label: "1440x900 (16:10)" },
      { width: 1600, height: 900, label: "1600x900 (16:9)" },
      { width: 1680, height: 1050, label: "1680x1050 (16:10)" },
      { width: 1920, height: 1080, label: "1920x1080 (16:9)" },
      { width: 1920, height: 1200, label: "1920x1200 (16:10)" },
      { width: 2560, height: 1440, label: "2560x1440 (16:9)" },
      { width: 2560, height: 1600, label: "2560x1600 (16:10)" },
      { width: 3440, height: 1440, label: "3440x1440 (21:9)" }
    ],
    []
  );

  const currentResolution = `${graphics.width}x${graphics.height}`;
  const currentOption = useMemo(
    () => resolutionOptions.find((opt) => `${opt.width}x${opt.height}` === currentResolution) ?? null,
    [currentResolution, resolutionOptions]
  );
  const screenAspect = useMemo(() => {
    if (typeof window === "undefined") return 1;
    const w = window.innerWidth || window.screen?.width || 1;
    const h = window.innerHeight || window.screen?.height || 1;
    return getAspect(w, h);
  }, []);

  const closestAspect = useMemo(() => {
    const candidates = [
      { id: "4:3", value: 4 / 3 },
      { id: "16:10", value: 16 / 10 },
      { id: "16:9", value: 16 / 9 },
      { id: "21:9", value: 21 / 9 }
    ];
    let best = candidates[0];
    let bestDiff = Math.abs(screenAspect - best.value);
    for (const candidate of candidates.slice(1)) {
      const diff = Math.abs(screenAspect - candidate.value);
      if (diff < bestDiff) {
        best = candidate;
        bestDiff = diff;
      }
    }
    return best.value;
  }, [screenAspect]);

  const isRecommended = (option: ResolutionOption) => {
    const optionAspect = getAspect(option.width, option.height);
    return Math.abs(optionAspect - closestAspect) <= 0.02;
  };

  useEffect(() => {
    const handleChange = () => {
      const doc = document as any;
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange as any);
    };
  }, []);

  useEffect(() => {
    if (!isResolutionOpen) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (resolutionRef.current?.contains(target)) return;
      setIsResolutionOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsResolutionOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isResolutionOpen]);

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") return;
    const doc = document as any;
    try {
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        const request = doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen;
        if (request) await request.call(doc.documentElement);
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
        if (exit) await exit.call(doc);
      }
    } catch {
      // ignore fullscreen failures
    }
  };

  return (
    <ModalShell
      title="Settings"
      onClose={() => dispatch(closeSettings())}
      backdropClassName="dialog-backdrop--settings"
      dialogClassName="settings-dialog"
      dialogStyle={{ maxHeight: "min(92vh, 1200px)" }}
    >
      <div className="settings-dialog__tabs">
        <button
          type="button"
          className={`settings-dialog__tab${activeTab === "general" ? " settings-dialog__tab--active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          type="button"
          className={`settings-dialog__tab${activeTab === "graphics" ? " settings-dialog__tab--active" : ""}`}
          onClick={() => setActiveTab("graphics")}
        >
          Graphics
        </button>
      </div>

      <div className="settings-dialog__body">
        {activeTab === "general" ? (
          <div className="settings-dialog__panel">
            <button
              type="button"
              className="settings-dialog__button"
              onClick={() => dispatch(openKeybinds())}
            >
              Keybinds
            </button>

            <button
              type="button"
              className="settings-dialog__button"
              onClick={async () => {
                await dispatch(resetProgress());
              }}
            >
              Delete Progress
            </button>
          </div>
        ) : null}

        {activeTab === "graphics" ? (
          <div className="settings-dialog__panel">
            <div className="settings-graphics__row">
              <span className="settings-graphics__label">Resolution</span>
              <span className="settings-graphics__control">
                <div className="settings-graphics__dropdown" ref={resolutionRef}>
                  <button
                    type="button"
                    className="settings-graphics__trigger"
                    onClick={() => setIsResolutionOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isResolutionOpen}
                  >
                    <span>{currentOption?.label ?? currentResolution}</span>
                    <span className="settings-graphics__caret" aria-hidden="true">▾</span>
                  </button>
                  {isResolutionOpen ? (
                    <div className="settings-graphics__menu" role="listbox">
                      {resolutionOptions.map((res) => {
                        const value = `${res.width}x${res.height}`;
                        const recommended = isRecommended(res);
                        const selected = value === currentResolution;
                        return (
                          <button
                            key={res.label}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={[
                              "settings-graphics__option",
                              selected ? "settings-graphics__option--selected" : "",
                              recommended ? "settings-graphics__option--recommended" : ""
                            ].filter(Boolean).join(" ")}
                            onClick={() => {
                              dispatch(setGraphicsResolution({ width: res.width, height: res.height }));
                              setIsResolutionOpen(false);
                            }}
                          >
                            <span>{res.label}</span>
                            {recommended ? <span className="settings-graphics__badge">Recommended</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </span>
            </div>

            <div className="settings-graphics__row">
              <span className="settings-graphics__label">Fullscreen</span>
              <span className="settings-graphics__control">
                <button
                  type="button"
                  className="settings-dialog__button"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                </button>
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
