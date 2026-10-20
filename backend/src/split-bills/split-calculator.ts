export interface ParticipantInput {
  name: string;
  amount?: number;
}

export interface SplitResult {
  myShare: number;
  shares: { participantName: string; amount: number }[];
}

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/**
 * Splits `total` between the payer ("me", optional) and participants.
 * Participants with an explicit amount keep it; the remainder is split equally between
 * everyone else. Works in integer cents so shares always add up to the total exactly;
 * leftover cents go to the first people in the list.
 */
export function computeSplit(
  total: number,
  participants: ParticipantInput[],
  includeMe: boolean,
): SplitResult {
  const totalCents = toCents(total);
  const fixedCents = participants.reduce((sum, p) => sum + (p.amount ? toCents(p.amount) : 0), 0);
  const remainingCents = totalCents - fixedCents;
  if (remainingCents < 0) {
    throw new Error('Tổng số tiền cố định vượt quá tổng hóa đơn');
  }

  const equalParticipants = participants.filter((p) => !p.amount);
  const equalCount = equalParticipants.length + (includeMe ? 1 : 0);

  if (equalCount === 0) {
    if (remainingCents !== 0) throw new Error('Tổng các phần chia không khớp tổng hóa đơn');
    return {
      myShare: 0,
      shares: participants.map((p) => ({ participantName: p.name, amount: p.amount as number })),
    };
  }

  const base = Math.floor(remainingCents / equalCount);
  let leftover = remainingCents - base * equalCount;
  const nextEqual = () => {
    const extra = leftover > 0 ? 1 : 0;
    leftover -= extra;
    return base + extra;
  };

  const myCents = includeMe ? nextEqual() : 0;
  const shares = participants.map((p) => ({
    participantName: p.name,
    amount: p.amount ? p.amount : fromCents(nextEqual()),
  }));

  return { myShare: fromCents(myCents), shares };
}
