import * as auth from "./auth";
import { applications } from "./applications";
import { auditLogs } from "./audit-logs";

export { applications, auditLogs };

export const {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} = auth;

export const schema = {
  user: auth.user,
  session: auth.session,
  account: auth.account,
  verification: auth.verification,
  applications,
  auditLogs,
} as const;

export type Schema = typeof schema;
