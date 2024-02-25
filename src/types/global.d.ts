declare namespace NodeJS {
  interface ProcessEnv {
    PATH: string;
    DEV?: "true" | "false";
    CLI_VERSION?: string;
    GIT_STACK_STANDALONE?: "true" | "false";
  }
}
