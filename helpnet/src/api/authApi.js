import { apiClient } from "./client";

export const authApi = {
  login: (email, senha) =>
    apiClient.post("/auth/login", { email, senha }).then((r) => r.data),
};
