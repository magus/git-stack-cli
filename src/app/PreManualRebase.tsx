import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

export function PreManualRebase() {
  return <Await fallback={null} function={run} />;
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const repo_root = state.repo_root;
  const argv = state.argv;

  invariant(repo_root, "repo_root must exist");
  invariant(argv, "argv must exist");

  if (!argv.template) {
    return actions.set((state) => {
      state.step = "manual-rebase";
    });
  }

  // ./.github/PULL_REQUEST_TEMPLATE/*.md
  let pr_templates: Array<string> = [];
  if (fs.existsSync(template_pr_template(repo_root))) {
    pr_templates = fs.readdirSync(template_pr_template(repo_root));
  }

  // look for pull request template
  // https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
  // ./.github/pull_request_template.md
  // ./pull_request_template.md
  // ./docs/pull_request_template.md
  let pr_template_body: null | string = null;
  if (fs.existsSync(github_pr_template(repo_root))) {
    pr_template_body = fs.readFileSync(github_pr_template(repo_root), "utf-8");
  } else if (fs.existsSync(root_pr_template(repo_root))) {
    pr_template_body = fs.readFileSync(root_pr_template(repo_root), "utf-8");
  } else if (fs.existsSync(docs_pr_template(repo_root))) {
    pr_template_body = fs.readFileSync(docs_pr_template(repo_root), "utf-8");
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
            count: (
              <Ink.Text color={colors.blue}>{pr_templates.length}</Ink.Text>
            ),
            dir: <Brackets>{template_pr_template("")}</Brackets>,
          }}
        />
      );
    }

    state.step = "manual-rebase";
  });
}

function github_pr_template(repo_root: string) {
  return path.join(repo_root, ".github", "pull_request_template.md");
}

function root_pr_template(repo_root: string) {
  return path.join(repo_root, "pull_request_template.md");
}

function docs_pr_template(repo_root: string) {
  return path.join(repo_root, "docs", "pull_request_template.md");
}

function template_pr_template(repo_root: string) {
  return path.join(repo_root, ".github", "PULL_REQUEST_TEMPLATE");
}
