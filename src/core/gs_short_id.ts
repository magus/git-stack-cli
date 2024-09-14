import { short_id } from "~/core/short_id";

export function gs_short_id() {
  return `gs-${short_id()}`;
}
