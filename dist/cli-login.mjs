import {
  runKlingLogin,
  runKlingLogout,
  runKlingStatus,
  runKlingUse
} from "./oauth-login.mjs";

function createKlingCommandHandler(run) {
  return async (options = {}) => {
    const code = await run(options);
    if (code !== 0) process.exitCode = code;
    return code;
  };
}

export function createKlingLoginCommandHandler(login = runKlingLogin, dependencies = {}) {
  return createKlingCommandHandler(({ region }) => login({ ...dependencies, region }));
}

export function createKlingStatusCommandHandler(status = runKlingStatus, dependencies = {}) {
  return createKlingCommandHandler(({ region }) => status({ ...dependencies, region }));
}

export function createKlingLogoutCommandHandler(logout = runKlingLogout, dependencies = {}) {
  return createKlingCommandHandler(({ region }) => logout({ ...dependencies, region }));
}

export function createKlingUseCommandHandler(use = runKlingUse, dependencies = {}) {
  return createKlingCommandHandler(({ region }) => use({ ...dependencies, region }));
}
