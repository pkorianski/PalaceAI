let queue: Promise<unknown> = Promise.resolve();
/** One writer lane for career, mastery, and destructive progress reset. */
export function playerWrite<T>(work: () => Promise<T>): Promise<T> {
  const job = queue.catch(() => {}).then(work);
  queue = job;
  return job;
}
export async function waitForPlayerWrites() {
  await queue.catch(() => {});
}
