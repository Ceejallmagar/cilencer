const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { verifyToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/admin');

// All admin routes require both token and admin verification
router.use(verifyToken, verifyAdmin);

// ============ DASHBOARD STATS ============
router.get('/stats', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const postsSnapshot = await db.collection('posts').get();
        const trollsSnapshot = await db.collection('trolls').get();

        // Active users (logged in last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsersSnapshot = await db.collection('users')
            .where('lastLogin', '>=', yesterday)
            .get();

        res.json({
            totalUsers: usersSnapshot.size,
            activeUsers: activeUsersSnapshot.size,
            totalPosts: postsSnapshot.size,
            totalTrolls: trollsSnapshot.size
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// ============ MEME WAR CONTROLS ============
router.post('/memewar/start', async (req, res) => {
    try {
        const { submissionDays = 2 } = req.body;

        const startDate = new Date();
        const submissionEndDate = new Date(startDate.getTime() + submissionDays * 24 * 60 * 60 * 1000);

        const war = {
            status: 'submission',
            startDate: admin.firestore.FieldValue.serverTimestamp(),
            submissionEndDate,
            votingEndDate: null,
            winnerId: null,
            winnerAnnouncement: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('meme_wars').add(war);

        // Notify all users
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();

        usersSnapshot.docs.forEach(userDoc => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                userId: userDoc.id,
                type: 'meme_war',
                message: '⚔️ MEME WAR HAS BEGUN! Submit your best memes now!',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        res.status(201).json({ id: docRef.id, message: 'Meme war started!' });
    } catch (error) {
        console.error('Start meme war error:', error);
        res.status(500).json({ error: 'Failed to start meme war' });
    }
});

router.post('/memewar/start-voting/:warId', async (req, res) => {
    try {
        const { warId } = req.params;
        const { votingDays = 2 } = req.body;

        const votingEndDate = new Date(Date.now() + votingDays * 24 * 60 * 60 * 1000);

        await db.collection('meme_wars').doc(warId).update({
            status: 'voting',
            votingEndDate
        });

        // Notify all users
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();

        usersSnapshot.docs.forEach(userDoc => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                userId: userDoc.id,
                type: 'meme_war',
                message: '🗳️ Voting has begun! Choose the most savage meme response!',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        res.json({ message: 'Voting started!' });
    } catch (error) {
        console.error('Start voting error:', error);
        res.status(500).json({ error: 'Failed to start voting' });
    }
});

router.post('/memewar/end/:warId', async (req, res) => {
    try {
        const { warId } = req.params;

        // Fetch all entries for this war
        const entriesSnapshot = await db.collection('meme_war_entries')
            .where('warId', '==', warId)
            .get();

        const batch = db.batch();
        const notificationCount = 0;

        // Process each battle individually
        if (!entriesSnapshot.empty) {
            for (const doc of entriesSnapshot.docs) {
                const entry = doc.data();
                const cVotes = entry.challengerVotes || 0;
                const rVotes = entry.responderVotes || 0;
                const challengerId = entry.challengerId;
                const responderId = entry.responderId;

                // Determine Battle Winner
                let battleWinnerId = null;
                let battleLoserId = null;

                if (responderId) {
                    // Start notification logic only if there was actual combat
                    if (cVotes > rVotes) {
                        battleWinnerId = challengerId;
                        battleLoserId = responderId;
                    } else if (rVotes > cVotes) {
                        battleWinnerId = responderId;
                        battleLoserId = challengerId;
                    } else {
                        // Tie - Notify both? Or no one wins. Let's notify tie.
                        [challengerId, responderId].forEach(uid => {
                            if (uid) {
                                const notifRef = db.collection('notifications').doc();
                                batch.set(notifRef, {
                                    userId: uid,
                                    type: 'meme_war_result',
                                    message: `🤝 Your meme battle ended in a DRAW (Votes: ${cVotes} vs ${rVotes})`,
                                    read: false,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                            }
                        });
                    }

                    if (battleWinnerId && battleLoserId) {
                        // Winner gets a point and notification
                        const winnerRef = db.collection('users').doc(battleWinnerId);
                        batch.update(winnerRef, {
                            memeWins: admin.firestore.FieldValue.increment(1)
                        });

                        const winnerNotifRef = db.collection('notifications').doc();
                        batch.set(winnerNotifRef, {
                            userId: battleWinnerId,
                            type: 'meme_war_result',
                            message: `🏆 VICTORY! You won your meme battle! (Score: ${Math.max(cVotes, rVotes)} - ${Math.min(cVotes, rVotes)})`,
                            read: false,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        // Loser gets notification
                        const loserNotifRef = db.collection('notifications').doc();
                        batch.set(loserNotifRef, {
                            userId: battleLoserId,
                            type: 'meme_war_result',
                            message: `💀 DEFEAT. You lost your meme battle. (Score: ${Math.min(cVotes, rVotes)} - ${Math.max(cVotes, rVotes)})`,
                            read: false,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
            }
        }

        // Mark war as ended
        await db.collection('meme_wars').doc(warId).update({
            status: 'ended',
            winnerAnnouncement: "Battles Concluded",
            endedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Commit all notifications
        await batch.commit();

        // Recalculate leaderboard
        await recalculatePositions();

        res.json({ message: 'Meme war ended! Battle results distributed.' });
    } catch (error) {
        console.error('End meme war error:', error);
        res.status(500).json({ error: 'Failed to end meme war' });
    }
});

// Helper to get username
async function getUserName(uid) {
    try {
        if (!uid) return "unknown";
        const doc = await db.collection('users').doc(uid).get();
        return doc.exists ? doc.data().username : "unknown";
    } catch (e) { return "unknown"; }
}

// Helper to recalculate positions based on meme wins
async function recalculatePositions() {
    try {
        // Fetch ALL users (without orderBy to avoid index error)
        // Note: For very large apps this needs pagination/optimization.
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

        // Sort in memory
        users.sort((a, b) => (b.memeWins || 0) - (a.memeWins || 0));

        const batch = db.batch();
        let position = 1;

        // Update top 100 only to save writes? Or all? 
        // Updating all might be heavy. Let's update top 50 for now.
        const topUsers = users.slice(0, 50);

        for (const user of topUsers) {
            const ref = db.collection('users').doc(user.id);
            batch.update(ref, { position });
            position++;
        }

        await batch.commit();
    } catch (error) {
        console.error("Recalculate positions failed (non-critical):", error);
    }
}

// ============ TROLL OF THE WEEK ============
router.post('/troll-of-week', async (req, res) => {
    try {
        const { trollId, responseId, winnerUserId } = req.body;

        // Clear previous winners safely
        const previousWinners = await db.collection('trolls')
            .where('isTrollOfWeek', '==', true)
            .get(); // Removed orderBy

        const batch = db.batch();
        previousWinners.docs.forEach(doc => {
            batch.update(doc.ref, { isTrollOfWeek: false });
        });

        // Set new winner
        const trollRef = db.collection('trolls').doc(trollId);
        const trollDoc = await trollRef.get();
        const trollData = trollDoc.data();

        // Find the winning response
        const responses = trollData.responses || [];
        const winningResponse = responses.find(r => r.id === responseId);

        batch.update(trollRef, {
            isTrollOfWeek: true,
            winnerResponse: winningResponse,
            winnerUserId
        });

        await batch.commit();

        // Update winner stats
        await db.collection('users').doc(winnerUserId).update({
            trollWins: admin.firestore.FieldValue.increment(1)
        });

        // Notify winner
        await db.collection('notifications').add({
            userId: winnerUserId,
            type: 'troll_win',
            message: '🤡 You are the TROLL OF THE WEEK! Epic roast!',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Troll of the week selected!' });
    } catch (error) {
        console.error('Troll of week error:', error);
        res.status(500).json({ error: 'Failed to select troll of week' });
    }
});

// ============ POST PROMOTION ============
router.post('/promote/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { promote = true } = req.body;

        await db.collection('posts').doc(postId).update({
            isPromoted: promote,
            promotedAt: promote ? admin.firestore.FieldValue.serverTimestamp() : null
        });

        res.json({ message: promote ? 'Post promoted!' : 'Post unpromoted' });
    } catch (error) {
        console.error('Promote error:', error);
        res.status(500).json({ error: 'Failed to promote post' });
    }
});

// ============ BROADCAST MESSAGE ============
router.post('/broadcast', async (req, res) => {
    try {
        const { message, type = 'admin_message' } = req.body;

        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();

        usersSnapshot.docs.forEach(userDoc => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                userId: userDoc.id,
                type,
                message,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        res.json({ message: 'Broadcast sent to all users!', recipients: usersSnapshot.size });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ error: 'Failed to broadcast' });
    }
});

// ============ ADMIN ACCOUNTS MANAGEMENT ============
router.get('/accounts', async (req, res) => {
    try {
        const snapshot = await db.collection('admin_accounts')
            .orderBy('index', 'asc')
            .get();

        const accounts = [];
        snapshot.forEach(doc => accounts.push({ id: doc.id, ...doc.data() }));

        res.json(accounts);
    } catch (error) {
        console.error('Get admin accounts error:', error);
        res.status(500).json({ error: 'Failed to get admin accounts' });
    }
});

router.post('/accounts', async (req, res) => {
    try {
        const { displayName, email, password } = req.body;

        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName
        });

        // Get next index
        const snapshot = await db.collection('admin_accounts').get();
        const nextIndex = snapshot.size + 1;

        // Create admin account record
        const adminAccount = {
            uid: userRecord.uid,
            displayName,
            email,
            index: nextIndex,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('admin_accounts').doc(userRecord.uid).set(adminAccount);

        // Create user profile with admin flag
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            displayName,
            username: displayName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            photoURL: '',
            bio: 'Official Admin Account',
            isAdmin: true,
            isVerified: true,
            position: 0,
            memeWins: 0,
            trollWins: 0,
            memeCount: 0,
            trollCount: 0,
            badges: ['admin_badge'],
            activeBadge: 'admin_badge',
            followers: 0,
            following: [],
            theme: 'dark',
            language: 'en',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ id: userRecord.uid, ...adminAccount });
    } catch (error) {
        console.error('Create admin account error:', error);
        res.status(500).json({ error: 'Failed to create admin account' });
    }
});

router.put('/accounts/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { displayName } = req.body;

        // Update Firebase Auth
        await admin.auth().updateUser(accountId, { displayName });

        // Update admin account record
        await db.collection('admin_accounts').doc(accountId).update({ displayName });

        // Update user profile
        await db.collection('users').doc(accountId).update({
            displayName,
            username: displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')
        });

        res.json({ message: 'Admin account updated!' });
    } catch (error) {
        console.error('Update admin account error:', error);
        res.status(500).json({ error: 'Failed to update admin account' });
    }
});

router.delete('/accounts/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;

        // Delete from Firebase Auth
        await admin.auth().deleteUser(accountId);

        // Delete admin account record
        await db.collection('admin_accounts').doc(accountId).delete();

        // Delete user profile
        await db.collection('users').doc(accountId).delete();

        res.json({ message: 'Admin account deleted!' });
    } catch (error) {
        console.error('Delete admin account error:', error);
        res.status(500).json({ error: 'Failed to delete admin account' });
    }
});

// Initialize 50 admin accounts
router.post('/initialize-accounts', async (req, res) => {
    try {
        const { basePassword = 'Admin@123' } = req.body;

        const existingAccounts = await db.collection('admin_accounts').get();
        if (existingAccounts.size >= 50) {
            return res.status(400).json({ error: 'Admin accounts already initialized' });
        }

        const createdAccounts = [];
        const startIndex = existingAccounts.size + 1;

        for (let i = startIndex; i <= 50; i++) {
            const displayName = `Admin ${i}`;
            const email = `admin${i}@silencebooster.local`;

            try {
                const userRecord = await admin.auth().createUser({
                    email,
                    password: basePassword,
                    displayName
                });

                const adminAccount = {
                    uid: userRecord.uid,
                    displayName,
                    email,
                    index: i,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('admin_accounts').doc(userRecord.uid).set(adminAccount);

                await db.collection('users').doc(userRecord.uid).set({
                    uid: userRecord.uid,
                    email,
                    displayName,
                    username: `admin_${i}`,
                    photoURL: '',
                    bio: 'Official Admin Account',
                    isAdmin: true,
                    isVerified: true,
                    position: 0,
                    memeWins: 0,
                    trollWins: 0,
                    memeCount: 0,
                    trollCount: 0,
                    badges: ['admin_badge'],
                    activeBadge: 'admin_badge',
                    followers: 0,
                    following: [],
                    theme: 'dark',
                    language: 'en',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });

                createdAccounts.push(adminAccount);
            } catch (err) {
                console.error(`Failed to create admin ${i}:`, err);
            }
        }

        res.status(201).json({
            message: `Created ${createdAccounts.length} admin accounts`,
            accounts: createdAccounts
        });
    } catch (error) {
        console.error('Initialize accounts error:', error);
        res.status(500).json({ error: 'Failed to initialize accounts' });
    }
});

// Get all posts for moderation
router.get('/posts', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const snapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit))
            .get();

        const posts = [];
        snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

        res.json(posts);
    } catch (error) {
        console.error('Get all posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Delete a post
router.delete('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        await db.collection('posts').doc(postId).delete();

        // Delete associated replies
        const repliesSnapshot = await db.collection('replies')
            .where('postId', '==', postId)
            .get();

        const batch = db.batch();
        repliesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        res.json({ message: 'Post deleted!' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Get all users for moderation
router.get('/users', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit))
            .get();

        const users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

module.exports = router;
