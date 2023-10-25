import { cli } from "./cli";

type Commit = {
  authoredDate: string; // "2023-10-22T23:13:35Z"
  authors: [
    {
      email: string;
      id: string;
      login: string; // magus
      name: string; // magus
    },
  ];
  committedDate: string; // "2023-10-23T08:41:27Z"
  messageBody: string;
  messageHeadline: string;
  oid: string; // "ce7eadaa73518a92ae6a892c1e54c4f4afa6fbdd"
};

type PullRequest = {
  number: number;
  commits: Array<Commit>;
};

export async function pr_status(branch: string): Promise<null | PullRequest> {
  const result = await cli(
    `gh pr list --head "${branch}" --json number,commits`,
  );

  if (result.stdout === "[]") {
    return null;
  }

  const pr_list: Array<PullRequest> = JSON.parse(result.stdout);
  const [first_pr] = pr_list;
  return first_pr;
}

export async function pr_create(branch: string) {
  const result = await cli(`gh pr create --fill --head "${branch}"`, {
    stdio: "inherit",
  });

  return result;
}
