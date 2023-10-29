import * as React from "react";

import { v4 as uuid_v4 } from "uuid";

import * as CommitMetadata from "../core/CommitMetadata.js";
import * as Metadata from "../core/Metadata.js";
import { cli } from "../core/cli.js";
import * as github from "../core/github.js";
import { invariant } from "../core/invariant.js";

import { Await } from "./Await.js";
import { Store } from "./Store.js";

type Props = {
  children: React.ReactNode;
};

export function ManualRebase(props: Props) {
  const branch_name = Store.useState((state) => state.branch_name);
  const merge_base = Store.useState((state) => state.merge_base);
  const commit_metadata_list = Store.useState(
    (state) => state.commit_metadata_list
  );

  invariant(branch_name, "branch_name must exist");
  invariant(merge_base, "merge_base must exist");
  invariant(commit_metadata_list, "commit_metadata_list must exist");

  return (
    <Await
      fallback={null}
      function={() =>
        manual_rebase({ branch_name, merge_base, commit_metadata_list })
      }
    >
      {props.children}
    </Await>
  );
}

type ManualRebaseArgs = {
  branch_name: string;
  merge_base: string;
  commit_metadata_list: Array<CommitMetadata.Type>;
};

async function manual_rebase(args: ManualRebaseArgs) {
  const temp_branch_name = `${args.branch_name}_${uuid_v4()}`;

  try {
    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${args.merge_base}`);

    const picked_commit_metadata_list = [];

    // cherry-pick and amend commits one by one
    for (let i = 0; i < args.commit_metadata_list.length; i++) {
      const sha = args.commit_metadata_list[i].sha;

      let base;
      if (i === 0) {
        base = "master";
      } else {
        base = picked_commit_metadata_list[i - 1].metadata.id;
        invariant(base, `metadata must be set on previous commit [${i}]`);
      }

      await cli(`git cherry-pick ${sha}`);

      const commit = await CommitMetadata.commit(sha, base);

      if (!commit.metadata.id) {
        commit.metadata.id = uuid_v4();
        await Metadata.write(commit);
      }

      picked_commit_metadata_list.push(commit);

      // always push to origin since github requires commit shas to line up perfectly
      console.debug();
      console.debug(`Syncing [${commit.metadata.id}] ...`);

      await cli(`git push -f origin HEAD:${commit.metadata.id}`);

      if (commit.pr_exists) {
        // ensure base matches pr in github
        await github.pr_base(commit.metadata.id, base);
      } else {
        try {
          // delete metadata id branch if leftover
          await cli(`git branch -D ${commit.metadata.id}`, {
            ignoreExitCode: true,
          });

          // move to temporary branch for creating pr
          await cli(`git checkout -b ${commit.metadata.id}`);

          // create pr in github
          await github.pr_create(commit.metadata.id, base);
        } catch (err) {
          console.error("Moving back to temp branch...");
          console.error(err);
        } finally {
          // move back to temp branch
          await cli(`git checkout ${temp_branch_name}`);

          // delete metadata id branch if leftover
          await cli(`git branch -D ${commit.metadata.id}`, {
            ignoreExitCode: true,
          });
        }
      }
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the temporary branch (with the metadata)
    await cli(`git branch -f ${args.branch_name} ${temp_branch_name}`);
  } catch (err) {
    console.error("Restoring original branch...");
    console.error(err);
  } finally {
    // always put self back in original branch
    await cli(`git checkout ${args.branch_name}`);
    // ...and cleanup temporary branch
    await cli(`git branch -D ${temp_branch_name}`, { ignoreExitCode: true });
  }

  // print_table(repo_path, await CommitMetadata.all());
}
