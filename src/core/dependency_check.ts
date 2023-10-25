import { is_command_available } from "./is_command_available";
import { exit } from "./exit";
import { cli } from "./cli";

export async function dependency_check() {
  if (!is_command_available("git")) {
    console.error(`git must be installed.`);
    return exit(2);
  }

  if (!is_command_available("gh")) {
    console.error(`gh must be installed.`);
    return exit(3);
  }

  const gh_auth_status_cli = await cli(`gh auth status`, {
    ignoreExitCode: true,
  });

  if (gh_auth_status_cli.code !== 0) {
    console.error(`gh requires login, please run \`gh auth login\`.`);
    return exit(4);
  }
}
