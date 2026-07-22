import * as _authSchema from "./schema/auth";
import * as _billingSchema from "./schema/billing";
import * as _analyticsSchema from "./schema/analytics";
import * as _adminSchema from "./schema/admin";

export const authSchema = _authSchema;
export const billingSchema = _billingSchema;
export const analyticsSchema = _analyticsSchema;
export const adminSchema = _adminSchema;

export * from "./schema/auth";
export * from "./schema/billing";
export * from "./schema/analytics";
export * from "./schema/admin";
export * from "./db";
