const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { verifyToken } = require('../middleware/auth');

// Get notifications for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { limit = 20, unreadOnly } = req.query;

        let query = db.collection('notifications')
            .where('userId', '==', userId);
        // Removed orderBy from query to avoid index requirement

        if (unreadOnly === 'true') {
            query = query.where('read', '==', false);
        }

        const snapshot = await query.get();
        const notifications = [];
        snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));

        // Sort in memory (descending by createdAt)
        notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Apply limit after sorting
        const limitedNotifications = notifications.slice(0, parseInt(limit));

        res.json(limitedNotifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();

        res.json({ count: snapshot.size });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark notification as read
router.put('/:notifId/read', verifyToken, async (req, res) => {
    try {
        const { notifId } = req.params;
        const userId = req.user.uid;

        const notifRef = db.collection('notifications').doc(notifId);
        const notifDoc = await notifRef.get();

        if (!notifDoc.exists) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Verify ownership
        if (notifDoc.data().userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await notifRef.update({ read: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

module.exports = router;
