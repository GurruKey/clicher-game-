const INSTANCE_SEPARATOR = ":";

export const createBagInstanceId = (bagId) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${bagId}${INSTANCE_SEPARATOR}${Date.now()}_${suffix}`;
};

export const getBagIdFromInstance = (instanceId) => {
  if (!instanceId) {
    return null;
  }
  const [bagId] = String(instanceId).split(INSTANCE_SEPARATOR);
  return bagId || null;
};
