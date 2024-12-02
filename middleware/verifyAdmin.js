const verifyAdmin = (req, res, next) => {
    // Assume the JWT payload includes the user's roles
    if (!req.user || !req.roles || !req.roles.includes('Admin')) {
        return res.status(403).json({ message: 'Access forbidden: Admins only' });
    }
    next(); // User has the Admin role, proceed to the next middleware
};

module.exports = verifyAdmin;