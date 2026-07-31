export async function stopHook(report) {
  await report();
  return "stopped";
}
