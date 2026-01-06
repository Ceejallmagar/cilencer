const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Middleware to verify auth token
const verifyToken = async (req, res, next) => {
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ error: 'No token provided' });

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET / - Fetch all active ads
router.get('/', async (req, res) => {
    try {
        const adsSnapshot = await db.collection('ads')
            .orderBy('createdAt', 'desc')
            .get();

        const ads = [];
        adsSnapshot.forEach(doc => {
            ads.push({ id: doc.id, ...doc.data() });
        });

        res.json(ads);
    } catch (error) {
        console.error('Fetch ads error:', error);
        res.status(500).json({ error: 'Failed to fetch ads' });
    }
});

// POST / - Create a new ad (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { title, content, imageURL, linkURL } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newAd = {
            title,
            content,
            imageURL: imageURL || null,
            linkURL: linkURL || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid
        };

        const docRef = await db.collection('ads').add(newAd);

        res.json({ id: docRef.id, message: 'Ad created successfully' });
    } catch (error) {
        console.error('Create ad error:', error);
        res.status(500).json({ error: 'Failed to create ad' });
    }
});

// DELETE /:id - Delete an ad (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('ads').doc(id).delete();
        res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Delete ad error:', error);
        res.status(500).json({ error: 'Failed to delete ad' });
    }
});

module.exports = router;
