import { v4 as uuid_v4 } from "uuid";
import child from "node:child_process";

main();

async function main() {
  const head_sha = (await cli("git rev-parse HEAD")).stdout;
  const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;
  const merge_base = (await cli("git merge-base HEAD master")).stdout;

  // handle when there are no detected changes
  if (head_sha === merge_base) {
    console.error("No changes detected.");
    return process.exit(400);
  }

  const git_commit_line_list = lines(
    (await cli(`git log master..HEAD --oneline --format=%H --color=never`))
      .stdout
  ).reverse();

  const temp_branch_name = `${branch_name}_${uuid_v4()}`;

  // TODO remove debug
  console.debug({ temp_branch_name, branch_name, merge_base });

  try {
    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${merge_base}`);

    // cherry-pick and amend commits one by one
    for (let i = 0; i < git_commit_line_list.length; i++) {
      const sha = git_commit_line_list[i];
      const message = await commit_message(sha);
      const metadata = await read_metadata(message);

      console.debug();
      console.debug(i, sha, { metadata });

      await cli(`git cherry-pick ${sha}`);

      if (!metadata.id) {
        metadata.id = uuid_v4();
        await write_metadata({ metadata, message });
      }
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the temporary branch (with the metadata)
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);
  } catch (err) {
    console.debug("Restoring original branch...");
    console.error(err);
  } finally {
    // always put self back in original branch
    await cli(`git checkout ${branch_name}`);
    // ...and cleanup temporary branch
    await cli(`git branch -D ${temp_branch_name}`);
  }
}

const TEMPLATE = {
  metadata_id(id: string) {
    return `git-multi-diff-id: ${id}`;
  },
};

const RE = {
  all_double_quote: /"/g,
  metadata_id: new RegExp(TEMPLATE.metadata_id("(?<id>[a-z0-9-]+)")),
};

type Metadata = {
  id: null | string;
  pr: null | number;
};

async function write_metadata(args: { metadata: Metadata; message: string }) {
  invariant(args.metadata.id, "metadata must have id");

  let message = args.message;
  message = message.replace(RE.all_double_quote, '\\"');

  const line_list = [message, "", TEMPLATE.metadata_id(args.metadata.id)];
  const new_message = line_list.join("\n");

  await cli(`git commit --amend -m "${new_message}"`);
}

async function read_metadata(message: string): Promise<Metadata> {
  const match = message.match(RE.metadata_id);

  const metadata: Metadata = {
    id: null,
    pr: null,
  };

  if (!match?.groups) {
    return metadata;
  }

  metadata.id = match.groups.id;

  return metadata;
}

async function commit_message(sha: string) {
  return (await cli(`git show -s --format=%B ${sha}`)).stdout;
}

function match_group(value: string, re: RegExp, group: string) {
  const match = value.match(re);
  const debug = `[${value}.match(${re})]`;
  invariant(match?.groups, `match.groups must exist ${debug}`);
  const result = match?.groups[group];
  invariant(result, `match.groups must contain [${group}] ${debug}`);
  return result;
}

function invariant(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function lines(value: string) {
  return value.split("\n");
}

type CLIOutput = {
  stdout: string;
  stderr: string;
  output: string;
};

async function cli(command: string): Promise<CLIOutput> {
  return new Promise((resolve, reject) => {
    const childProcess = child.spawn("sh", ["-c", command]);

    let stdout = "";
    let stderr = "";
    let output = "";

    childProcess.stdout.on("data", (data: Buffer) => {
      // console.debug(String(data));

      stdout += data.toString();
      output += data.toString();
    });

    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      output += data.toString();
    });

    childProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`[${command}] (${code})`));
      } else {
        resolve({
          stdout: stdout.trimEnd(),
          stderr: stderr.trimEnd(),
          output: output.trimEnd(),
        });
      }
    });

    childProcess.on("error", (err) => {
      reject(err);
    });
  });
}

function int(value: string) {
  return parseInt(value, 10);
}
