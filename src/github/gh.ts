import { match_group } from "~/core/match_group";

export function auth_status(output: string) {
  let username;

  username = match_group.safe(output, RE.logged_in_as, "username");
  if (username) return username;

  username = match_group.safe(output, RE.logged_in_account, "username");
  if (username) return username;

  return null;
}

const RE = {
  // Logged in to github.com as magus
  logged_in_as: /Logged in to github.com as (?<username>[^\s]+)/,
  logged_in_account: /Logged in to github.com account (?<username>[^\s]+)/,
};
