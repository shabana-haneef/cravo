import { AppError } from '../errors/AppError.js';

/**
 * Role authorization middleware
 * Restricts route access to specific user roles.
 * Must be used AFTER the `protect` auth middleware.
 * 
 * @param  {...string} roles - Array of allowed roles (e.g., 'ADMIN', 'SELLER')
 */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Failsafe in case protect middleware was forgotten
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
