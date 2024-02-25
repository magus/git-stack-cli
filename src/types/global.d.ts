declare namespace NodeJS {
  interface ProcessEnv {
    PATH: string;
    DEV?: "true" | "false";
    CLI_VERSION?: string;
    GIT_STACK_STANDALONE?: "true" | "false";
    GIT_SEQUENCE_EDITOR_SCRIPT?: string;
  }
}
