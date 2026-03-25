import { api } from "./axios";
import { User } from "@/contexts/AuthContext";

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: "brand" | "influencer";
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface ProfileResponse {
  user: User;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", { email, password });
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  profile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>("/auth/profile");
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ProfileResponse> => {
    const response = await api.patch<ProfileResponse>("/auth/profile", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>("/auth/refresh");
    return response.data;
  },
};
