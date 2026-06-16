import { verifyToken } from '../utils/jwt.js';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';
import { userRepository } from '../../modules/users/repositories/user.repository.js';

/**
 * Protect middleware
 * Validates the JWT access token and securely attaches the user to the request object.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Support both Bearer token and Cookie-based authentication
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Not authorized to access this route', 401);
    }

    // Verify token signature and expiration
    const decoded = verifyToken(token, env.JWT_ACCESS_SECRET);

    // Fetch user from database
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new AppError('The user belonging to this token no longer exists', 401);
    }

    // Mandatory Security Checks
    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Contact support.', 403);
    }
    
    if (user.status === 'INACTIVE') {
      throw new AppError('Your account is inactive.', 403);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email address to continue.', 403);
    }

    // Attach user to request object for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};
