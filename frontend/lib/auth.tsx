"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { authAPI } from "./api";

// Client-side cookie helpers
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${secure}`;
};

const eraseCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

interface User {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: string;
  permissions?: Record<string, boolean>;
  assignedTrainer?: string;
}

interface AuthContextType {
  user: User | null;
  admin: User | null; // Alias for backwards compatibility
  userType: "staff" | "member" | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  memberLogin: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // All initial state is null/true — matches what the server renders.
  // Never read localStorage here or you'll get a React hydration error.
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"staff" | "member" | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track whether a fresh login just happened so we skip background revalidation
  // (avoids race: old refreshMe running with stale token clears the new session).
  const justLoggedIn = useRef(false);

  const refreshMe = useCallback(async () => {
    try {
      const type = localStorage.getItem("alphalift_user_type") as "staff" | "member" | null;
      let res;
      if (type === "member") {
        res = await authAPI.getMemberMe();
        setUserType("member");
      } else {
        res = await authAPI.getMe();
        setUserType("staff");
      }
      const freshUser = res.data.data;
      setUser(freshUser);
      // Keep cache fresh for next load
      localStorage.setItem("alphalift_user", JSON.stringify(freshUser));
    } catch {
      // Only clear session if this is a background revalidation, not a fresh login.
      // If justLoggedIn is true, a new token was set — don't wipe it.
      if (!justLoggedIn.current) {
        setUser(null);
        setUserType(null);
        setToken(null);
        localStorage.removeItem("alphalift_token");
        localStorage.removeItem("alphalift_user");
        localStorage.removeItem("alphalift_user_type");
        eraseCookie("alphalift_token");
      }
    }
  }, []);

  useEffect(() => {
    // Runs only on the client after hydration — safe to read localStorage here.
    const storedToken = localStorage.getItem("alphalift_token");

    if (!storedToken) {
      eraseCookie("alphalift_token");
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setCookie("alphalift_token", storedToken); // Ensure cookie is synced with localstorage

    // Apply cached user immediately — UI shows without any network wait
    const cachedUser = localStorage.getItem("alphalift_user");
    const cachedType = localStorage.getItem("alphalift_user_type") as "staff" | "member" | null;
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setUserType(cachedType);
        setIsLoading(false); // Unblock UI now using cached data
      } catch { /* corrupt cache — fall through, API will fix it */ }
    }

    // Silently revalidate token in the background
    refreshMe().finally(() => setIsLoading(false));
  }, [refreshMe]);

  const login = async (username: string, password: string) => {
    justLoggedIn.current = true;
    const res = await authAPI.login({ username, password });
    const { token: newToken, admin: adminData } = res.data;
    localStorage.setItem("alphalift_token", newToken);
    localStorage.setItem("alphalift_user", JSON.stringify(adminData));
    localStorage.setItem("alphalift_user_type", "staff");
    setCookie("alphalift_token", newToken);
    setToken(newToken);
    setUser(adminData);
    setUserType("staff");
    // Let the flag persist for a brief moment then clear it
    setTimeout(() => { justLoggedIn.current = false; }, 3000);
  };

  const memberLogin = async (phone: string, password: string) => {
    justLoggedIn.current = true;
    const res = await authAPI.memberLogin({ phone, password });
    const { token: newToken, member: memberData } = res.data;
    localStorage.setItem("alphalift_token", newToken);
    localStorage.setItem("alphalift_user", JSON.stringify(memberData));
    localStorage.setItem("alphalift_user_type", "member");
    setCookie("alphalift_token", newToken);
    setToken(newToken);
    setUser(memberData);
    setUserType("member");
    // Let the flag persist for a brief moment then clear it
    setTimeout(() => { justLoggedIn.current = false; }, 3000);
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem("alphalift_token");
    localStorage.removeItem("alphalift_user");
    localStorage.removeItem("alphalift_user_type");
    eraseCookie("alphalift_token");
    setToken(null);
    setUser(null);
    setUserType(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user,
        userType,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        memberLogin,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
