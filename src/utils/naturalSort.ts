/**
 * Natural sort comparison function.
 * Accurately sorts alphanumeric strings with numbers in human order:
 * 1, 2, 3... 9, 10, 11, 12... 99, 100, 101
 * N1, N2... N9, N10, N11... N99, N100
 */
export function naturalCompare(a: string | undefined | null, b: string | undefined | null): number {
  const strA = (a || '').trim();
  const strB = (b || '').trim();

  return strA.localeCompare(strB, 'hu', {
    numeric: true,
    sensitivity: 'base',
  });
}
