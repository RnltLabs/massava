"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * User Role Enum - Edge-Compatible
 * Duplicated from Prisma schema for use in Edge Runtime (middleware)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["STUDIO_OWNER"] = "STUDIO_OWNER";
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["GUEST"] = "GUEST";
})(UserRole || (exports.UserRole = UserRole = {}));
