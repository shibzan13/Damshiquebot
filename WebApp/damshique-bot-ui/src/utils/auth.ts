/**
 * Get the admin authentication token from localStorage
 * @returns The admin token or empty string if not found
 */
export function getAdminToken(): string {
    return localStorage.getItem("admin_token") || "";
}

/**
 * Get the current admin user info from localStorage
 * @returns The user object or null if not found
 */
export function getAdminUser(): { name: string; role: string } | null {
    const userStr = localStorage.getItem("admin_user");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuth(): void {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
}
