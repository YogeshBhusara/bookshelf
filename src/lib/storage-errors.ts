export class StorageQuotaError extends Error {
  constructor(message = "Your browser storage is full.") {
    super(message);
    this.name = "StorageQuotaError";
  }
}

export function isQuotaError(error: unknown): boolean {
  if (error instanceof StorageQuotaError) return true;
  if (error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.code === 22 ||
      error.code === 1014
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("quota") || msg.includes("storage");
  }
  return false;
}

export function quotaErrorMessage(succeeded: number, failedName?: string): string {
  const base =
    succeeded > 0
      ? `${succeeded} book${succeeded === 1 ? "" : "s"} were saved, but storage ran out`
      : "Storage is full on this device";
  const tail = failedName ? ` while adding “${failedName}”` : "";
  return `${base}${tail}. Remove some books or free browser storage, then try again.`;
}
