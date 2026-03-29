import { ROLES } from "./roles";

export function getDashboardRoute(role) {
  switch (role) {
    case ROLES.SYSTEM_ADMIN:
      return "/system-admin/users";
    case ROLES.ADMIN:
      return "/admin/dashboard";

    case ROLES.SECURITY:
      return "/security/dashboard";

    case ROLES.STUDENT:
      return "/student/dashboard";

    default:
      return "/";
  }
}