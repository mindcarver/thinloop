/** Normalize the two observed ZCode CLI shapes without accepting malformed lists. */
export function pluginList(platformId, response) {
  if (Array.isArray(response)) return response;
  if (platformId === "zcode" && Array.isArray(response?.plugins)) return response.plugins;
  return null;
}
