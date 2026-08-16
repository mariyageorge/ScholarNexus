export type UserSession = {
  email: string;
  role: string;
  name: string;
  profileCompleted: boolean;
  displayName?: string;
  affiliation?: string;
  bio?: string;
  phone?: string;
  researchInterests?: string | string[];
  profileImage?: string;
  provider?: string;
  providerId?: string;
  photoURL?: string;
  updatedAt?: string;

  /* Faculty Fields */
  status?: string;
  approvalStatus?: string;
  institution?: string;
  department?: string;
  designation?: string;
  facultyId?: string;
  areasOfExpertise?: string | string[];
  orcid?: string;
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
  window.dispatchEvent(new Event("scholarnexus-session-updated"));
}

export function clearUserSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getUserDisplayName(user: UserSession | null): string {
  if (!user) return "Researcher";

  const displayName = (user.displayName || "").trim();
  if (displayName.length > 0) {
    return displayName;
  }

  const name = (user.name || "").trim();
  if (name.length > 0) {
    return name;
  }

  if (user.email && user.email.includes("@")) {
    const localPart = user.email.split("@")[0];
    if (localPart) {
      const formatted = localPart
        .replace(/[._-]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      if (formatted.trim().length > 0) {
        return formatted.trim();
      }
    }
  }

  return "Researcher";
}

export function getUserInitials(user: UserSession | null): string {
  const name = getUserDisplayName(user);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
    .slice(0, 2) || "R";
}

export function getHomePathForRole(role?: string, email?: string, status?: string): string {
  const r = (role || "").toLowerCase();
  const e = (email || "").toLowerCase();
  const s = (status || "").toLowerCase();
  if (r === "admin" || e === "scholarnexusadmin@gmail.com") return "/admin";
  if (r === "faculty") {
    if (s === "active" || s === "approved") return "/faculty-dashboard";
    return "/faculty-pending";
  }
  return "/dashboard";
}
