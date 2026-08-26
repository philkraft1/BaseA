/** Public Base RPC rejects eth_getLogs spans over 10,000 blocks. */
export const LOG_RANGE_LIMIT = BigInt(10_000)

export function isRpcRateLimited(error: unknown) {
  const text =
    error && typeof error === 'object'
      ? `${(error as { shortMessage?: string; message?: string; details?: string }).shortMessage ?? ''} ${(error as { message?: string }).message ?? ''} ${(error as { details?: string }).details ?? ''}`
      : String(error)
  return /over rate limit|rate limit|429|-32016/i.test(text)
}

export async function withRpcRetry<T>(
  run: () => Promise<T>,
  attempts = 4,
): Promise<T> {
  let last: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await run()
    } catch (error) {
      last = error
      if (!isRpcRateLimited(error) || i === attempts - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** i))
    }
  }
  throw last
}

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
    all.push(
      ...(await withRpcRetry(() => fetchChunk(start, end))),
    )
  }
  return all
}
