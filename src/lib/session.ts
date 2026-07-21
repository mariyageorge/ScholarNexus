export type UserSession = {
  email: string;
  role: string;
  name: string;
  profileCompleted: boolean;
  displayName?: string;
  affiliation?: string;
  bio?: string;
  provider?: string;
  providerId?: string;
  photoURL?: string;
};

const STORAGE_KEY = "scholarnexusUser";

export function parseUserSession(raw: string | null): UserSession | null {
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    if (!user || typeof user !== "object" || typeof user.email !== "string") {
      return null;
    }
    return user as UserSession;
  } catch {
    return null;
  }
}

export function getUserSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  return parseUserSession(window.localStorage.getItem(STORAGE_KEY));
}

export function setUserSession(user: UserSession): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUserSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getUserInitials(user: UserSession | null): string {
  const name = user?.displayName ?? user?.name ?? "Guest";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
    .slice(0, 2) || "G";
}

export function getHomePathForRole(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "faculty") return "/faculty";
  return "/dashboard";
}
