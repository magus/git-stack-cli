import * as React from "react";

import fs from "node:fs/promises";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { safe_exists } from "~/core/safe_exists";

export function PreManualRebase() {
  return <Await fallback={null} function={run} />;
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const repo_root = state.repo_root;
  const argv = state.argv;

  invariant(repo_root, "repo_root must exist");

  if (!argv.template) {
    return actions.set((state) => {
      state.step = "manual-rebase";
    });
  }

  let pr_template_body: null | string = null;

  // look for pull request template
  // https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
  // ./.github/pull_request_template.md
  // ./pull_request_template.md
  // ./docs/pull_request_template.md
  for (const key of PR_TEMPLATE_KEY_LIST) {
    const pr_template_fn = PR_TEMPLATE[key];
    const pr_template_file = pr_template_fn(repo_root);

    if (await safe_exists(pr_template_file)) {
      pr_template_body = await fs.readFile(pr_template_file, "utf-8");

      actions.output(
        <FormatText
          wrapper={<Ink.Text color={colors.yellow} />}
          message="Using PR template {pr_filepath}"
          values={{
            pr_filepath: <Brackets>{pr_template_fn("")}</Brackets>,
          }}
        />,
      );

      break;
    }
  }

  let pr_templates: Array<string> = [];
  let pr_dir: string = "";

  // ./.github/PULL_REQUEST_TEMPLATE/*.md
  pr_dir = PR_TEMPLATE.DirGithub(repo_root);
  if (await safe_exists(pr_dir)) {
    for (const filename of await fs.readdir(pr_dir)) {
      pr_templates.push(path.join(pr_dir, filename));
    }
  }

  // ./docs/PULL_REQUEST_TEMPLATE/*.md
  pr_dir = PR_TEMPLATE.DirDocs(repo_root);
  if (await safe_exists(pr_dir)) {
    for (const filename of await fs.readdir(pr_dir)) {
      pr_templates.push(path.join(pr_dir, filename));
    }
  }

  // check if repo has multiple pr templates
  actions.set((state) => {
    state.pr_template_body = pr_template_body;
    state.pr_templates = pr_templates;

    if (pr_templates.length > 0) {
      actions.output(
        <Ink.Box flexDirection="column">
          {pr_templates.map((filepath) => {
            const relpath = path.relative(repo_root, filepath);
            return <Ink.Text key={filepath}>- {relpath}</Ink.Text>;
          })}

          <FormatText
            wrapper={<Ink.Text color={colors.yellow} />}
            message="{count} queryable templates found, but not supported."
            values={{
              count: <Ink.Text color={colors.blue}>{pr_templates.length}</Ink.Text>,
            }}
          />
        </Ink.Box>,
      );
    }

    state.step = "manual-rebase";
  });
}

// prettier-ignore
const PR_TEMPLATE = Object.freeze({
  Github: (root: string) => path.join(root, ".github", "pull_request_template.md"),
  Root: (root: string) => path.join(root, "pull_request_template.md"),
  Docs: (root: string) => path.join(root, "docs", "pull_request_template.md"),

  DirDocs: (root: string) => path.join(root, "docs", "PULL_REQUEST_TEMPLATE/"),
  DirGithub: (root: string) => path.join(root, ".github", "PULL_REQUEST_TEMPLATE/"),
});

// prettier-ignore
//
const PR_TEMPLATE_KEY_LIST = ["Github", "Root", "Docs"] satisfies Array<keyof typeof PR_TEMPLATE>;
