export function shouldRetry(status, attempt, maxRetries) {
  return status >= 500 && attempt <= maxRetries;
}
