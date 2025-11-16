exports.checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: `Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)}s only.` });
    }
  };
};