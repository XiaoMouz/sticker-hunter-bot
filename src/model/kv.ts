import type { StorageValue } from "unstorage";

export async function getValue<T extends StorageValue>(key: string) {
  const storage = useStorage("kv");
  const result = await storage.getItem<T>(key);
  return result;
}

export async function setValue<T extends StorageValue>(key: string, value: T) {
  const storage = useStorage("kv");
  await storage.setItem(key, value);
}
