import { runKlingLogin } from "./oauth-login.mjs";

export function createKlingLoginCommandHandler(login = runKlingLogin) {
  return async ({ region } = {}) => {
    const code = await login({ region });
    if (code !== 0) process.exitCode = code;
    return code;
  };
}

export const handleKlingLoginCommand = createKlingLoginCommandHandler();
