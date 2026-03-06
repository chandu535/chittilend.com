function requireRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required: ${allowedRoles.join(" or ")}`);
  }
}
export {
  requireRole as r
};
