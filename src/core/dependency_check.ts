import { color } from "./color";
import { is_command_available } from "./is_command_available";
import { exit } from "./exit";
import { cli } from "./cli";

export async function dependency_check() {
  if (!is_command_available("git")) {
    console.error(`${color.cmd("git")} must be installed.`);
    return exit(2);
  }

  if (!is_command_available("gh")) {
    console.error(`${color.cmd("gh")} must be installed.`);
    // prettier-ignore
    console.error(
      `Visit ${color.url("https://cli.github.com/")} to install the github cli (${color.cmd("gh")})`,
    );
    return exit(3);
  }

  const gh_auth_status_cli = await cli(`gh auth status`, {
    ignoreExitCode: true,
  });

  if (gh_auth_status_cli.code !== 0) {
    // prettier-ignore
    console.error(`${color.cmd('gh')} requires login, please run \`${color.cmd('gh auth login')}\`.`);
    return exit(4);
  }
}
