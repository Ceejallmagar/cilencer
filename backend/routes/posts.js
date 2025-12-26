const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { verifyToken } = require('../middleware/auth');

// Get posts with filters
router.get('/', async (req, res) => {
    try {
        const { category, trending, limit = 20, lastId } = req.query;
        let userId = null;

        // Extract userId from token if available to personalize
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split('Bearer ')[1];
                const decodedToken = await admin.auth().verifyIdToken(token);
                userId = decodedToken.uid;
            } catch (e) { /* ignore invalid token for public feed */ }
        }

        // 1. Fetch Candidates (Fetch more than limit to re-rank)
        let query = db.collection('posts').orderBy('createdAt', 'desc');

        if (category && category !== 'all') {
            query = query.where('category', 'array-contains', category);
        }

        // Fetch 50 items for re-ranking (unless specific pagination is requested)
        if (!lastId && !category && userId) {
            query = query.limit(50);
        } else {
            query = query.limit(parseInt(limit));
        }

        if (lastId) {
            const lastDoc = await db.collection('posts').doc(lastId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        let posts = [];
        snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

        // 2. Personalize / Re-rank if user is logged in
        if (userId && posts.length > 0 && !category) {
            const userDoc = await db.collection('users').doc(userId).get();
            const interests = userDoc.data()?.interests || {};

            posts = posts.map(post => {
                let score = 1.0; // Base score

                // Recency Boost (Time Decay): Newer posts get higher score
                const hoursOld = (Date.now() - post.createdAt?.toDate().getTime()) / (1000 * 60 * 60);
                score += Math.max(10 - hoursOld, 0) * 0.5; // High boost for very new posts

                // Affinity Boost: Matches user interests
                if (post.category) {
                    post.category.forEach(cat => {
                        if (interests[cat]) {
                            score += (interests[cat] * 0.5); // Add 0.5 points per interest level
                        }
                    });
                }

                // Engagement Boost (Social Proof)
                score += (post.likes || 0) * 0.1;

                return { ...post, recommendationScore: score };
            });

            // Sort by recommendation score desc
            posts.sort((a, b) => b.recommendationScore - a.recommendationScore);

            // Randomize the top posts for variety (Fisher-Yates Shuffle)
            // We shuffle the top 20-30 to keep high quality but change order
            for (let i = posts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [posts[i], posts[j]] = [posts[j], posts[i]];
            }

            // Slice back to requested limit
            posts = posts.slice(0, parseInt(limit));
        } else if (!category && !lastId) {
            // Even for public feed, shuffle the top results if it's the first page
            for (let i = posts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [posts[i], posts[j]] = [posts[j], posts[i]];
            }
            posts = posts.slice(0, parseInt(limit));
        }

        res.json(posts);
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Create new post
router.post('/', verifyToken, async (req, res) => {
    try {
        const { content, imageURL, category } = req.body;
        const userId = req.user.uid;

        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        const newPost = {
            userId,
            username: userData.username,
            userPhotoURL: userData.photoURL || '',
            userDisplayName: userData.displayName,
            isVerified: userData.isVerified || false,
            content,
            imageURL: imageURL || '',
            category: category || [],
            likes: 0,
            likedBy: [],
            replyCount: 0,
            shares: 0,
            isPromoted: false,
            engagement: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('posts').add(newPost);

        // Increment user's meme count
        await db.collection('users').doc(userId).update({
            memeCount: admin.firestore.FieldValue.increment(1)
        });

        // Check for badge eligibility
        const updatedUser = await db.collection('users').doc(userId).get();
        const memeCount = updatedUser.data().memeCount;

        // Award badges based on meme count
        if (memeCount === 100 || memeCount === 500 || memeCount === 1000) {
            await awardMileStoneBadge(userId, memeCount);
        }

        res.status(201).json({ id: docRef.id, ...newPost });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Helper function to award milestone badges
async function awardMileStoneBadge(userId, count) {
    const badgeMap = {
        100: { id: 'meme_flower', name: 'Flower', icon: '🌸' },
        500: { id: 'meme_star', name: 'Star', icon: '⭐' },
        1000: { id: 'meme_crown', name: 'Crown', icon: '👑' }
    };

    const badge = badgeMap[count];
    if (badge) {
        await db.collection('users').doc(userId).update({
            badges: admin.firestore.FieldValue.arrayUnion(badge.id)
        });

        // Create notification
        await db.collection('notifications').add({
            userId,
            type: 'badge',
            message: `🎉 You earned the ${badge.icon} ${badge.name} badge for posting ${count} memes!`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
}

// Like a post
router.post('/:postId/like', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.uid;

        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const postData = postDoc.data();
        const alreadyLiked = postData.likedBy && postData.likedBy.includes(userId);

        if (alreadyLiked) {
            // Unlike
            await postRef.update({
                likes: admin.firestore.FieldValue.increment(-1),
                likedBy: admin.firestore.FieldValue.arrayRemove(userId),
                engagement: admin.firestore.FieldValue.increment(-1)
            });
            res.json({ liked: false });
        } else {
            // Like
            await postRef.update({
                likes: admin.firestore.FieldValue.increment(1),
                likedBy: admin.firestore.FieldValue.arrayUnion(userId),
                engagement: admin.firestore.FieldValue.increment(1)
            });

            // Update user interests for recommendation algorithm
            if (postData.category && postData.category.length > 0) {
                const userRef = db.collection('users').doc(userId);
                // Use transaction or simple update (simple update is faster, less strict)
                const interestUpdates = {};
                postData.category.forEach(cat => {
                    interestUpdates[`interests.${cat}`] = admin.firestore.FieldValue.increment(1);
                });
                await userRef.update(interestUpdates).catch(err => console.log('Interest update non-fatal error', err));
            }

            // Notify post owner (if not self)
            if (postData.userId !== userId) {
                await db.collection('notifications').add({
                    userId: postData.userId,
                    type: 'like',
                    message: `Someone liked your post! 😄`,
                    postId,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            res.json({ liked: true });
        }
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Get replies for a post
router.get('/:postId/replies', async (req, res) => {
    try {
        const { postId } = req.params;

        const snapshot = await db.collection('replies')
            .where('postId', '==', postId)
            .orderBy('createdAt', 'asc')
            .get();

        const replies = [];
        snapshot.forEach(doc => replies.push({ id: doc.id, ...doc.data() }));

        res.json(replies);
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ error: 'Failed to get replies' });
    }
});

// Reply to a post
router.post('/:postId/reply', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.uid;

        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        const reply = {
            postId,
            userId,
            username: userData.username,
            userPhotoURL: userData.photoURL || '',
            userDisplayName: userData.displayName,
            content,
            likes: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('replies').add(reply);

        // Update post reply count and engagement
        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        await postRef.update({
            replyCount: admin.firestore.FieldValue.increment(1),
            engagement: admin.firestore.FieldValue.increment(2)
        });

        // Notify post owner
        if (postDoc.data().userId !== userId) {
            await db.collection('notifications').add({
                userId: postDoc.data().userId,
                type: 'reply',
                message: `@${userData.username} replied to your post!`,
                postId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(201).json({ id: docRef.id, ...reply });
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ error: 'Failed to reply' });
    }
});

// Search posts
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const lowercaseQuery = query.toLowerCase();

        // Simple text search (for better search, consider Algolia or Elasticsearch)
        const snapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const posts = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.content && data.content.toLowerCase().includes(lowercaseQuery)) {
                posts.push({ id: doc.id, ...data });
            }
        });

        res.json(posts.slice(0, 20));
    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ error: 'Failed to search posts' });
    }
});

// Get low engagement posts (for push algorithm)
router.get('/discover', async (req, res) => {
    try {
        // Get posts with low engagement to give them visibility
        // Simplified query to avoid composite index requirement
        // LIMIT TO 50 to avoid fetching entire database
        const snapshot = await db.collection('posts')
            .where('engagement', '<', 10)
            .limit(50)
            .get();

        let posts = [];
        snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

        // Sort in memory by engagement asc, then createdAt desc
        posts.sort((a, b) => {
            const engA = a.engagement || 0;
            const engB = b.engagement || 0;
            if (engA !== engB) {
                return engA - engB;
            }
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return (dateB instanceof Date && !isNaN(dateB) ? dateB : 0) - (dateA instanceof Date && !isNaN(dateA) ? dateA : 0);
        });

        // Apply limit
        posts = posts.slice(0, 10);

        res.json(posts);
    } catch (error) {
        console.error('Discover posts error:', error);
        res.status(500).json({ error: 'Failed to get discover posts' });
    }
});

module.exports = router;
