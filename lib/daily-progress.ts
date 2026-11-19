import type { ActiveDailyChallenge } from "./daily-challenge";
import type { GameResult } from "./stats";
function getProgressDelta(type: string, result: GameResult): number {
  switch (type) {
    case "win1":
    case "win2":
    case "win3":
      return result.won ? 1 : 0;
    case "play3":
    case "play5":
      return 1;
    case "burn5":
    case "burn8":
      return result.burns;
    case "clean":
      return result.won && result.pickups === 0 ? 1 : 0;
    case "comeback":
      return result.won && result.pickups >= 2 ? 1 : 0;
    case "blazer3":
      return result.burns >= 3 ? 1 : 0;
    case "blazer5":
      return result.burns >= 5 ? 1 : 0;
    case "speed20":
      return result.won && result.turns <= 20 ? 1 : 0;
    default:
      return 0;
  }
}

export function applyDailyResult(
  challenge: ActiveDailyChallenge,
  result: GameResult,
  roundId: string | undefined,
  completedDay: string,
) {
  if (
    challenge.completed ||
    challenge.date !== completedDay ||
    (roundId && challenge.receipts?.includes(roundId))
  )
    return { challenge, justCompleted: false };
  const progress = Math.min(
    challenge.target,
    challenge.progress + getProgressDelta(challenge.type, result),
  );
  const updated: ActiveDailyChallenge = {
    ...challenge,
    progress,
    completed: progress >= challenge.target,
    receipts: roundId
      ? [...(challenge.receipts ?? []), roundId]
      : challenge.receipts,
  };
  return { challenge: updated, justCompleted: updated.completed };
}
