const { verifyAccessToken } = require('../utils/jwt');
const db = require('../database/db');

/**
 * Authentication middleware: verifies Bearer token or httpOnly cookie
 */
async function authenticateToken(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.ekavach_access_token) {
    token = req.cookies.ekavach_access_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in with your credentials.',
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired access token. Please refresh your session.',
    });
  }

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: {
      patientProfile: true,
      doctorProfile: true,
      hospitalAdminProfile: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      error: 'User account is inactive, suspended, or does not exist.',
    });
  }

  // Attach session context
  req.user = {
    id: user.id,
    registration_id: user.registration_id,
    registrationId: user.registration_id,
    email: user.email,
    role: user.role, // 'patient' | 'doctor' | 'hospital'
    patientProfile: user.patientProfile || null,
    doctorProfile: user.doctorProfile || null,
    hospitalAdminProfile: user.hospitalAdminProfile || null,
  };

  next();
}

/**
 * Role authorization guard
 * @param  {...string} allowedRoles e.g. 'patient', 'doctor', 'hospital', 'hospital_admin'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const normalizedUserRole = req.user.role === 'hospital_admin' ? 'hospital' : req.user.role;
    const normalizedAllowed = allowedRoles.map((r) => (r === 'hospital_admin' ? 'hospital' : r));

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied: Role '${req.user.role}' is not authorized for this resource. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
