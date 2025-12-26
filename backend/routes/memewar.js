const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { verifyToken } = require('../middleware/auth');

// Get active meme war
router.get('/active', async (req, res) => {
    try {
        // Simple query first to avoid complex index requirements
        const snapshot = await db.collection('meme_wars')
            .where('status', 'in', ['upcoming', 'submission', 'voting'])
            .get();

        if (snapshot.empty) {
            return res.json({ active: false, war: null });
        }

        // Sort in memory by startDate descending
        const wars = [];
        snapshot.forEach(doc => wars.push({ id: doc.id, ...doc.data() }));

        wars.sort((a, b) => {
            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
            return (dateB instanceof Date && !isNaN(dateB) ? dateB : 0) - (dateA instanceof Date && !isNaN(dateA) ? dateA : 0);
        });

        const war = wars[0];
        res.json({ active: true, war });
    } catch (error) {
        console.error('Get active meme war error:', error);
        res.status(500).json({ error: 'Failed to get active meme war' });
    }
});

// Get meme war entries
router.get('/:warId/entries', async (req, res) => {
    try {
        const { warId } = req.params;

        const snapshot = await db.collection('meme_war_entries')
            .where('warId', '==', warId)
            .get();

        // Process entries in parallel to fetch user data
        const entries = await Promise.all(snapshot.docs.map(async (doc) => {
            const entry = { id: doc.id, ...doc.data() };

            // Fetch user data in parallel if needed
            const promises = [];
            if (entry.challengerId) promises.push(db.collection('users').doc(entry.challengerId).get());
            if (entry.responderId) promises.push(db.collection('users').doc(entry.responderId).get());

            const results = await Promise.all(promises);

            let resultIndex = 0;
            if (entry.challengerId) {
                const cDoc = results[resultIndex++];
                entry.challengerData = cDoc.exists ? cDoc.data() : null;
            }
            if (entry.responderId) {
                const rDoc = results[resultIndex++];
                entry.responderData = rDoc.exists ? rDoc.data() : null;
            }

            return entry;
        }));

        // Sort in memory
        entries.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return (dateB instanceof Date && !isNaN(dateB) ? dateB : 0) - (dateA instanceof Date && !isNaN(dateA) ? dateA : 0);
        });

        res.json(entries);
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({ error: 'Failed to get entries' });
    }
});

// Submit meme for war (as challenger)
router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { warId, memeContent, memeImageURL } = req.body;
        const userId = req.user.uid;

        // Check if war is in submission phase
        const warDoc = await db.collection('meme_wars').doc(warId).get();
        if (!warDoc.exists || warDoc.data().status !== 'submission') {
            return res.status(400).json({ error: 'Meme war is not accepting submissions' });
        }

        // Check if user already submitted (optimized to avoid composite index)
        const userSubmissions = await db.collection('meme_war_entries')
            .where('challengerId', '==', userId)
            .get();

        const existingSubmission = userSubmissions.docs.find(doc => doc.data().warId === warId);

        if (existingSubmission) {
            return res.status(400).json({ error: 'You already submitted a meme for this war' });
        }

        const entry = {
            warId,
            challengerId: userId,
            challengerMeme: memeContent,
            challengerImageURL: memeImageURL || '',
            responderId: null,
            responderMeme: null,
            responderImageURL: null,
            // Voting counters
            votes: 0,
            challengerVotes: 0,
            responderVotes: 0,
            voterIds: [],

            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('meme_war_entries').add(entry);
        res.status(201).json({ id: docRef.id, ...entry });
    } catch (error) {
        console.error('Submit meme error:', error);
        res.status(500).json({ error: 'Failed to submit meme' });
    }
});

// Respond to a meme challenge
router.post('/respond/:entryId', verifyToken, async (req, res) => {
    try {
        const { entryId } = req.params;
        const { memeContent, memeImageURL } = req.body;
        const userId = req.user.uid;

        const entryRef = db.collection('meme_war_entries').doc(entryId);
        const entryDoc = await entryRef.get();

        if (!entryDoc.exists) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        const entry = entryDoc.data();

        // Check if already responded
        if (entry.responderId) {
            return res.status(400).json({ error: 'This meme already has a response' });
        }

        // Check if trying to respond to own meme
        if (entry.challengerId === userId) {
            return res.status(400).json({ error: 'Cannot respond to your own meme' });
        }

        // Check war status
        const warDoc = await db.collection('meme_wars').doc(entry.warId).get();
        if (warDoc.data().status !== 'submission') {
            return res.status(400).json({ error: 'Submissions are closed' });
        }

        await entryRef.update({
            responderId: userId,
            responderMeme: memeContent,
            responderImageURL: memeImageURL || '',
            status: 'responded',
            respondedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Response submitted successfully' });
    } catch (error) {
        console.error('Respond error:', error);
        res.status(500).json({ error: 'Failed to respond' });
    }
});

// Vote for a response or challenger
router.post('/vote/:entryId', verifyToken, async (req, res) => {
    try {
        const { entryId } = req.params;
        const { target } = req.body; // 'challenger' or 'responder'
        const userId = req.user.uid;

        const entryRef = db.collection('meme_war_entries').doc(entryId);
        const entryDoc = await entryRef.get();

        if (!entryDoc.exists) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        const entry = entryDoc.data();

        // Check war is in voting phase
        const warDoc = await db.collection('meme_wars').doc(entry.warId).get();
        if (warDoc.data().status !== 'voting') {
            return res.status(400).json({ error: 'Voting is not open' });
        }

        // Check if already voted
        if (entry.voterIds && entry.voterIds.includes(userId)) {
            return res.status(400).json({ error: 'You already voted on this battle' });
        }

        // Determine update
        const updateData = {
            votes: admin.firestore.FieldValue.increment(1),
            voterIds: admin.firestore.FieldValue.arrayUnion(userId)
        };

        if (target === 'challenger') {
            updateData.challengerVotes = admin.firestore.FieldValue.increment(1);
        } else if (target === 'responder') {
            if (!entry.responderId) {
                return res.status(400).json({ error: 'Cannot vote for responder yet' });
            }
            updateData.responderVotes = admin.firestore.FieldValue.increment(1);
        } else {
            // Fallback for default 'responder' vote if not specified
            if (entry.responderId) {
                updateData.responderVotes = admin.firestore.FieldValue.increment(1);
            } else {
                return res.status(400).json({ error: 'Specify target: challenger or responder' });
            }
        }

        await entryRef.update(updateData);

        res.json({ message: 'Vote recorded' });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Failed to vote' });
    }
});

// Get past meme war winners
router.get('/winners', async (req, res) => {
    try {
        const snapshot = await db.collection('meme_wars')
            .where('status', '==', 'ended')
            .get();

        const winners = await Promise.all(snapshot.docs.map(async (doc) => {
            const war = { id: doc.id, ...doc.data() };
            if (war.winnerId) {
                const winnerDoc = await db.collection('users').doc(war.winnerId).get();
                war.winnerData = winnerDoc.exists ? winnerDoc.data() : null;
            }
            return war;
        }));

        // Sort in memory
        winners.sort((a, b) => {
            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
            return (dateB instanceof Date && !isNaN(dateB) ? dateB : 0) - (dateA instanceof Date && !isNaN(dateA) ? dateA : 0);
        });

        const limitedWinners = winners.slice(0, 10);
        res.json(limitedWinners);
    } catch (error) {
        console.error('Get winners error:', error);
        res.status(500).json({ error: 'Failed to get winners' });
    }
});

module.exports = router;
