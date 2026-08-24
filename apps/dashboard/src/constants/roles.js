export const ROLES = {
  BUYER: 'BUYER',
  FPO: 'FPO',
  ADMIN: 'ADMIN',
  GOVERNMENT_EVALUATOR: 'GOVERNMENT_EVALUATOR',
};

export const ROLE_LABELS = {
  [ROLES.BUYER]: 'Institutional Buyer',
  [ROLES.FPO]: 'FPO Representative',
  [ROLES.ADMIN]: 'Platform Administrator',
  [ROLES.GOVERNMENT_EVALUATOR]: 'Government Evaluator',
};

export const ROLE_HOME_ROUTES = {
  [ROLES.BUYER]: '/buyer/dashboard',
  [ROLES.FPO]: '/fpo/dashboard',
  [ROLES.ADMIN]: '/admin/overview',
  [ROLES.GOVERNMENT_EVALUATOR]: '/admin/overview',
};
