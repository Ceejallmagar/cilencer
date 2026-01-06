const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Create or update user profile after authentication
router.post('/create-profile', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL } = req.body;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // User exists, just update last login
            await userRef.update({
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            });
            return res.json({ message: 'User logged in', user: userDoc.data() });
        }

        // Create new user profile
        const newUser = {
            uid,
            email,
            displayName: displayName || email.split('@')[0],
            username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
            photoURL: photoURL || '',
            bio: '',
            isAdmin: false,
            isVerified: false,
            position: 0,
            memeWins: 0,
            trollWins: 0,
            memeCount: 0,
            trollCount: 0,
            badges: [],
            activeBadge: null,
            followers: 0,
            following: [],
            theme: 'dark',
            language: 'en',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(newUser);
        res.status(201).json({ message: 'User created', user: newUser });

    } catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({ error: 'Failed to create user profile' });
    }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(userDoc.data());
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

module.exports = router;
