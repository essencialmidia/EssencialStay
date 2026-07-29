export const TOKEN_ENDPOINT = "/api/v1.0/invoke/open-ability/method/oauth2/token";

export function passwordGrantBody(config) {
  return new URLSearchParams({
    grant_type: "password",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "manager",
    username: config.username,
    password: config.password,
  });
}

export function refreshGrantBody(config, refreshToken) {
  return new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });
}
