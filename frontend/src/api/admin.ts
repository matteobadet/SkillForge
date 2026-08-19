import { apiJson } from "./client";

export interface BucketUsage {
  bucket: string;
  label: string;
  objectCount: number;
  totalBytes: number;
}

export interface StorageUsage {
  totalBytes: number;
  computedAt: string;
  buckets: BucketUsage[];
}

export function getStorageUsage() {
  return apiJson<StorageUsage>("/api/admin/storage");
}
