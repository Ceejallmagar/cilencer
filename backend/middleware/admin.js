const admin = require('firebase-admin');
const db = admin.firestore();

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(403).json({ error: 'Forbidden: User not found' });
        }

        const userData = userDoc.data();

        if (!userData.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        req.adminUser = userData;
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({ error: 'Server error during admin verification' });
    }
};

module.exports = { verifyAdmin };
