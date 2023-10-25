import { is_command_available } from "./is_command_available";
import { exit } from "./exit";

export function dependency_check() {
  if (!is_command_available("git")) {
    console.error(`git must be installed.`);
    return exit(2);
  }

  if (!is_command_available("gh")) {
    console.error(`gh must be installed.`);
    return exit(3);
  }
}
