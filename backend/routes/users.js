const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { verifyToken } = require('../middleware/auth');

// Get user profile
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        // Remove sensitive fields for public profile
        delete userData.email;

        res.json(userData);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update user profile
router.put('/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure user can only update their own profile
        if (req.user.uid !== userId) {
            return res.status(403).json({ error: 'Cannot update other user profiles' });
        }

        const { displayName, username, bio, photoURL, theme, language, activeBadge } = req.body;

        const updates = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (username !== undefined) updates.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (bio !== undefined) updates.bio = bio;
        if (photoURL !== undefined) updates.photoURL = photoURL;
        if (theme !== undefined) updates.theme = theme;
        if (language !== undefined) updates.language = language;
        if (activeBadge !== undefined) updates.activeBadge = activeBadge;

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('users').doc(userId).update(updates);

        const updatedDoc = await db.collection('users').doc(userId).get();
        res.json(updatedDoc.data());
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Search users
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const lowercaseQuery = query.toLowerCase();

        // Search by username (starts with)
        const snapshot = await db.collection('users')
            .where('username', '>=', lowercaseQuery)
            .where('username', '<=', lowercaseQuery + '\uf8ff')
            .limit(20)
            .get();

        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            users.push({
                uid: data.uid,
                displayName: data.displayName,
                username: data.username,
                photoURL: data.photoURL,
                isAdmin: data.isAdmin,
                isVerified: data.isVerified,
                position: data.position
            });
        });

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Follow an admin user
router.post('/:userId/follow', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.user.uid;

        // Check if target user is admin
        const targetUser = await db.collection('users').doc(userId).get();
        if (!targetUser.exists || !targetUser.data().isAdmin) {
            return res.status(400).json({ error: 'Can only follow admin accounts' });
        }

        // Add to following list
        await db.collection('users').doc(followerId).update({
            following: admin.firestore.FieldValue.arrayUnion(userId)
        });

        // Increment followers count
        await db.collection('users').doc(userId).update({
            followers: admin.firestore.FieldValue.increment(1)
        });

        res.json({ message: 'Followed successfully' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow user
router.post('/:userId/unfollow', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.user.uid;

        await db.collection('users').doc(followerId).update({
            following: admin.firestore.FieldValue.arrayRemove(userId)
        });

        await db.collection('users').doc(userId).update({
            followers: admin.firestore.FieldValue.increment(-1)
        });

        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Get user's meme contributions
router.get('/:userId/memes', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, lastId } = req.query;

        let query = db.collection('posts')
            .where('userId', '==', userId)
            //.orderBy('createdAt', 'desc')
            .limit(parseInt(limit));

        if (lastId) {
            const lastDoc = await db.collection('posts').doc(lastId).get();
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        const posts = [];
        snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

        res.json(posts);
    } catch (error) {
        console.error('Get user memes error:', error);
        res.status(500).json({ error: 'Failed to get user memes' });
    }
});

// Get user's troll contributions
router.get('/:userId/trolls', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        const snapshot = await db.collection('trolls')
            .where('targetUserId', '==', userId)
            .limit(parseInt(limit))
            .get();

        const trolls = [];
        snapshot.forEach(doc => trolls.push({ id: doc.id, ...doc.data() }));

        res.json(trolls);
    } catch (error) {
        console.error('Get user trolls error:', error);
        res.status(500).json({ error: 'Failed to get user trolls' });
    }
});

module.exports = router;
