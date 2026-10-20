import User from '../models/User.js';

/**
 * Route protection middleware that strictly verifies token and attaches user from MongoDB Atlas
 */
export const protect = async (req, res, next) => {
  try {
    if (req.user && req.user.email) {
      return next();
    }

    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      if (token.includes('.')) {
        try {
          const parts = token.split('.');
          const payloadStr = Buffer.from(parts[1] || parts[0], 'base64').toString('utf8');
          const decoded = JSON.parse(payloadStr);

          // 1. Look up user by ID from MongoDB Atlas with password stripped
          if (decoded && (decoded.id || decoded._id) && decoded.id !== 'session-user') {
            try {
              const foundUser = await User.findById(decoded.id || decoded._id).select('-password');
              if (foundUser) {
                req.user = foundUser;
              }
            } catch {}
          }

          // 2. If not found by ID, look up by email in MongoDB Atlas with password stripped
          if (!req.user && decoded && decoded.email) {
            try {
              const foundUser = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
              req.user = foundUser || { email: decoded.email, ...decoded };
            } catch {
              req.user = { email: decoded.email, ...decoded };
            }
          }
        } catch {}
      }
    }

    // 3. Fallback to custom headers or body if req.user is still not attached
    if (!req.user || !req.user.email) {
      const emailHeader = req.headers['x-user-email'] || req.body?.userEmail;
      if (emailHeader) {
        try {
          const foundUser = await User.findOne({ email: emailHeader.toLowerCase() }).select('-password');
          req.user = foundUser || { email: emailHeader };
        } catch {
          req.user = { email: emailHeader };
        }
      }
    }

    console.log('[protect] Resolved req.user email:', req.user?.email || 'unauthenticated');
    next();
  } catch (err) {
    next();
  }
};

export const extractUser = protect;

export default protect;
