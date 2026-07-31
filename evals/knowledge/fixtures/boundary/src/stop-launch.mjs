export const targetPlatform = "linux";

export function launchReporter() {
  return { mode: "in-process", platform: targetPlatform };
}
