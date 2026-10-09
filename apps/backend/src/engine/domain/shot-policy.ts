export function shouldStopBurst(input: {
  aborted: boolean;
  confirmedFill: boolean;
  stopOnFirstSuccess?: boolean;
  antiDoubleSpend?: boolean;
}): boolean {
  if (input.aborted) return true;
  if (!input.confirmedFill) return false;
  return input.stopOnFirstSuccess === true || input.antiDoubleSpend === true;
}
