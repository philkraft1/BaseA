/** Public Base RPC rejects eth_getLogs spans over 10,000 blocks. */
export const LOG_RANGE_LIMIT = BigInt(10_000)

export async function getLogsInRange<T>(
  fetchChunk: (fromBlock: bigint, toBlock: bigint) => Promise<T[]>,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<T[]> {
  const all: T[] = []
  for (let start = fromBlock; start <= toBlock; start += LOG_RANGE_LIMIT) {
    const end =
      start + LOG_RANGE_LIMIT - BigInt(1) > toBlock
        ? toBlock
        : start + LOG_RANGE_LIMIT - BigInt(1)
    all.push(...(await fetchChunk(start, end)))
  }
  return all
}
