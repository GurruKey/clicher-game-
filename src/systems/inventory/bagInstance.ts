const INSTANCE_SEPARATOR = ":";

export function createBagInstanceId(bagId: string, nowMs: number, suffix: string) {
  return `${bagId}${INSTANCE_SEPARATOR}${nowMs}_${suffix}`;
}

export function getBagIdFromInstance(instanceId: string | null | undefined) {
  if (!instanceId) return null;
  const [bagId] = String(instanceId).split(INSTANCE_SEPARATOR);
  return bagId || null;
}

