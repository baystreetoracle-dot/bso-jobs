import { fetchOfficialHtml } from "./official-html.mjs";

export function fetchEightfold(config, firm) {
  return fetchOfficialHtml({ ...config, linkPattern: /\/careers\/job\/\d+/i }, firm);
}
