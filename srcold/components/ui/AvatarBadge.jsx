import React from "react";
import AvatarCircle from "./AvatarCircle.jsx";
import * as ALL_RESOURCES_DATA from "../../data/resources/index.js";

export function ResourceBarHUD({ label, current, max, color, textColor }) {
  const fillRatio = max > 0 ? Math.min(1, current / max) : 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        className="stamina-bar"
        aria-label={`${label} ${Math.floor(current)} of ${max}`}
        style={{ marginBottom: '0' }} 
      >
        <div
          className="stamina-bar__fill"
          style={{ 
            width: `${fillRatio * 100}%`,
            backgroundColor: color 
          }}
        />
        <span 
          className="stamina-bar__text"
          style={{ color: textColor || "#ffffff" }}
        >
          {Math.floor(current)}/{max}
        </span>
      </div>
    </div>
  );
}

export default function AvatarBadge({
  onOpen,
  avatarIcon,
  avatarBg,
  avatarName,
  avatarIconOffset,
  avatarIconScale,
  avatarBgOffset,
  avatarBgScale,
  resources,
  resourceMaxValues = {}
}) {
  const resourceDefs = Object.values(ALL_RESOURCES_DATA || {}).filter(
    (def) => def && typeof def === "object" && def.id
  );

  return (
    <>
      <div className="avatar-panel">
        <AvatarCircle
          as="button"
          className="avatar-circle--hud"
          size={74}
          onClick={onOpen}
          icon={avatarIcon}
          bg={avatarBg}
          name={avatarName}
          iconOffset={avatarIconOffset}
          iconScale={avatarIconScale}
          bgOffset={avatarBgOffset}
          bgScale={avatarBgScale}
        />
      </div>
      
      <div style={{ 
        position: 'absolute', 
        left: '16px', 
        top: '100px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '6px',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        {resourceDefs.map((def) => {
          // A resource is active ONLY if it exists in the resources state
          // which is managed by the useResources hook (and filtered by perks)
          if (!resources || resources[def.id] === undefined) {
            return null;
          }

          const current = resources[def.id];
          const max = resourceMaxValues?.[def.id] ?? def.base ?? 0;

          return (
            <ResourceBarHUD
              key={def.id}
              label={def.label}
              current={current ?? 0}
              max={max}
              color={def.color ?? "#4caf50"}
              textColor={def.textColor}
            />
          );
        })}
      </div>
    </>
  );
}
