import { fetchOfficialHtml } from "./official-html.mjs";

export function fetchTalnet(config, firm) {
  return fetchOfficialHtml({ ...config, linkPattern: /\/candidate\/jobboard\/vacancy\/\d+/i }, firm);
}
