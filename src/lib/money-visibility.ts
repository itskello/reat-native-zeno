/** Replaces a displayed monetary value while the Wallet privacy toggle is on. */
export function concealMoney(value: string, isHidden: boolean): string {
  return isHidden ? "••••••" : value;
}
