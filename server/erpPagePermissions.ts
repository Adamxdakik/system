import type { Request, Response } from "express";
import { FEATURE_KEYS, type FeatureKey, type RoleFeaturePermission } from "@shared/schema";
import { sendNoCompanyAccess } from "./roleAuthorization";

const POS_SAFE_FEATURE_KEYS = new Set<FeatureKey>([
  "pos",
  "pos_daybook",
  "location_inventory",
  "suppliers",
  "customers",
  "vouchers",
  "daybook",
  "sales_report",
]);

const NON_ADMIN_FALLBACK_KEYS = FEATURE_KEYS.filter((key) => key !== "settings");

function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

export interface ErpPageAccess {
  pageKeys: FeatureKey[];
  fullAccess: boolean;
  hiddenErpCostFields: string[];
}

export function resolveErpPageAccess(
  role: string,
  allPermissions: RoleFeaturePermission[],
): ErpPageAccess {
  if (role === "Admin") {
    return {
      pageKeys: [...FEATURE_KEYS],
      fullAccess: true,
      hiddenErpCostFields: [],
    };
  }

  const rolePermissions = allPermissions.filter((permission) => permission.role === role);
  const storedKeys = rolePermissions
    .filter((permission) => permission.enabled && isFeatureKey(permission.featureKey))
    .map((permission) => permission.featureKey as FeatureKey);

  if (role.startsWith("POS")) {
    const pageKeys =
      rolePermissions.length > 0
        ? storedKeys.filter((key) => POS_SAFE_FEATURE_KEYS.has(key))
        : [...POS_SAFE_FEATURE_KEYS];
    return { pageKeys, fullAccess: false, hiddenErpCostFields: [] };
  }

  if (role === "Owner" || role === "Manager") {
    return {
      pageKeys: rolePermissions.length > 0 ? storedKeys : [...NON_ADMIN_FALLBACK_KEYS],
      fullAccess: false,
      hiddenErpCostFields: [],
    };
  }

  return { pageKeys: [], fullAccess: false, hiddenErpCostFields: [] };
}

export function createErpPageAccessHandler(
  getRoleFeaturePermissions: (companyId: number) => Promise<RoleFeaturePermission[]>,
) {
  return async (req: Request, res: Response) => {
    const companyId = req.session.currentCompanyId;
    const role = req.user?.role || req.session.currentRole;
    if (!companyId || !role) {
      return sendNoCompanyAccess(req, res);
    }

    const permissions = await getRoleFeaturePermissions(companyId);
    return res.json(resolveErpPageAccess(role, permissions));
  };
}
