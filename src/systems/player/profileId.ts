const PROFILE_SEPARATOR = ":";

export function createProfileId(baseAvatarId: string, nowMs: number, suffix: string): string {
  return `${baseAvatarId}${PROFILE_SEPARATOR}${nowMs}_${suffix}`;
}

export function getBaseAvatarIdFromProfileId(profileId: string | null | undefined): string | null {
  if (!profileId || typeof profileId !== "string") return null;
  const [base] = profileId.split(PROFILE_SEPARATOR);
  return base && base.length > 0 ? base : null;
}

