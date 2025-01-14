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
    const pr_template_fn = PR_TEMPLATE[key as keyof typeof PR_TEMPLATE];

    if (await safe_exists(pr_template_fn(repo_root))) {
      pr_template_body = await fs.readFile(pr_template_fn(repo_root), "utf-8");

      actions.output(
        <FormatText
          wrapper={<Ink.Text color={colors.yellow} />}
          message="Using PR template {pr_filepath}"
          values={{
            pr_filepath: <Brackets>{pr_template_fn("")}</Brackets>,
          }}
        />
      );

      break;
    }
  }

  // ./.github/PULL_REQUEST_TEMPLATE/*.md
  let pr_templates: Array<string> = [];
  if (await safe_exists(PR_TEMPLATE.TemplateDir(repo_root))) {
    pr_templates = await fs.readdir(PR_TEMPLATE.TemplateDir(repo_root));
  }

  // check if repo has multiple pr templates
  actions.set((state) => {
    state.pr_template_body = pr_template_body;
    state.pr_templates = pr_templates;

    if (pr_templates.length > 0) {
      actions.output(
        <FormatText
          wrapper={<Ink.Text color={colors.yellow} />}
          message="{count} queryable templates found under {dir}, but not supported."
          values={{
            count: <Ink.Text color={colors.blue}>{pr_templates.length}</Ink.Text>,
            dir: <Brackets>{PR_TEMPLATE.TemplateDir("")}</Brackets>,
          }}
        />
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
  TemplateDir: (root: string) => path.join(root, ".github", "PULL_REQUEST_TEMPLATE"),
});

// prettier-ignore
const PR_TEMPLATE_KEY_LIST = Object.keys(PR_TEMPLATE) as Array<keyof typeof PR_TEMPLATE>;
