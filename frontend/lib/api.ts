// Base URL for API calls. Default to environment variable or dynamic localhost/IP.
const getApiBaseUrl = () => {
    const defaultPort = '5001';
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // If we're on localhost or an IP, use the same host for API on port 5001
        return `http://${hostname}:${defaultPort}/api`;
    }
    return process.env.NEXT_PUBLIC_API_URL || `http://127.0.0.1:${defaultPort}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Get auth token from Firebase
async function getAuthToken() {
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
}

// API client with automatic token handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
    try {
        const token = await getAuthToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        // Better error handling for mobile
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
    }
}

// Auth API
export const authAPI = {
    createProfile: (data: { uid: string; email: string; displayName?: string; photoURL?: string }) =>
        apiRequest('/auth/create-profile', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: (userId: string) => apiRequest(`/auth/profile/${userId}`),
};

// Users API
export const usersAPI = {
    getUser: (userId: string) => apiRequest(`/users/${userId}`),
    updateUser: (userId: string, data: Record<string, any>) =>
        apiRequest(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    searchUsers: (query: string) => apiRequest(`/users/search/${encodeURIComponent(query)}`),
    follow: (userId: string) => apiRequest(`/users/${userId}/follow`, { method: 'POST' }),
    unfollow: (userId: string) => apiRequest(`/users/${userId}/unfollow`, { method: 'POST' }),
    getUserMemes: (userId: string, limit = 20) => apiRequest(`/users/${userId}/memes?limit=${limit}`),
    getUserTrolls: (userId: string, limit = 20) => apiRequest(`/users/${userId}/trolls?limit=${limit}`),
};

// Posts API
export const postsAPI = {
    getPosts: (params: { category?: string; trending?: boolean; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params.category) searchParams.set('category', params.category);
        if (params.trending) searchParams.set('trending', 'true');
        if (params.limit) searchParams.set('limit', params.limit.toString());
        return apiRequest(`/posts?${searchParams.toString()}`);
    },
    createPost: (data: { content: string; imageURL?: string; category?: string[] }) =>
        apiRequest('/posts', { method: 'POST', body: JSON.stringify(data) }),
    likePost: (postId: string) => apiRequest(`/posts/${postId}/like`, { method: 'POST' }),
    getReplies: (postId: string) => apiRequest(`/posts/${postId}/replies`),
    addReply: (postId: string, content: string) =>
        apiRequest(`/posts/${postId}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
    searchPosts: (query: string) => apiRequest(`/posts/search/${encodeURIComponent(query)}`),
    discoverPosts: () => apiRequest('/posts/discover'),
    deletePost: (postId: string) => apiRequest(`/posts/${postId}`, { method: 'DELETE' }),
    notInterested: (postId: string) => apiRequest(`/posts/${postId}/not-interested`, { method: 'POST' }),
};

// Meme War API
export const memeWarAPI = {
    getActiveWar: () => apiRequest('/memewar/active'),
    getEntries: (warId: string) => apiRequest(`/memewar/${warId}/entries`),
    submitMeme: (data: { warId: string; memeContent: string; memeImageURL?: string }) =>
        apiRequest('/memewar/submit', { method: 'POST', body: JSON.stringify(data) }),
    respondToMeme: (entryId: string, data: { memeContent: string; memeImageURL?: string }) =>
        apiRequest(`/memewar/respond/${entryId}`, { method: 'POST', body: JSON.stringify(data) }),
    vote: (entryId: string, target?: 'challenger' | 'responder') =>
        apiRequest(`/memewar/vote/${entryId}`, { method: 'POST', body: JSON.stringify({ target }) }),
    getWinners: () => apiRequest('/memewar/winners'),
};

// Trolls API
export const trollsAPI = {
    getTrolls: (limit = 20) => apiRequest(`/trolls?limit=${limit}`),
    getTrollOfWeek: () => apiRequest('/trolls/winner'),
    createTroll: (data: { targetType: 'me' | 'him'; content: string; targetUserId?: string }) =>
        apiRequest('/trolls', { method: 'POST', body: JSON.stringify(data) }),
    respondToTroll: (trollId: string, data: { content: string; imageURL?: string }) =>
        apiRequest(`/trolls/${trollId}/respond`, { method: 'POST', body: JSON.stringify(data) }),
    likeTrollResponse: (trollId: string, responseId: string) =>
        apiRequest(`/trolls/${trollId}/like/${responseId}`, { method: 'POST' }),
    getTopResponses: (trollId: string) => apiRequest(`/trolls/${trollId}/top-responses`),
    deleteTroll: (trollId: string) => apiRequest(`/trolls/${trollId}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsAPI = {
    getNotifications: (limit = 20, unreadOnly = false) =>
        apiRequest(`/notifications?limit=${limit}&unreadOnly=${unreadOnly}`),
    getUnreadCount: () => apiRequest('/notifications/unread-count'),
    markAsRead: (notifId: string) =>
        apiRequest(`/notifications/${notifId}/read`, { method: 'PUT' }),
    markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
};

// Admin API
export const adminAPI = {
    getStats: () => apiRequest('/admin/stats'),

    // Meme War Controls
    startMemeWar: (submissionDays = 2) =>
        apiRequest('/admin/memewar/start', { method: 'POST', body: JSON.stringify({ submissionDays }) }),
    startVoting: (warId: string, votingDays = 2) =>
        apiRequest(`/admin/memewar/start-voting/${warId}`, { method: 'POST', body: JSON.stringify({ votingDays }) }),
    endMemeWar: (warId: string, winnerId: string, winnerAnnouncement: string) =>
        apiRequest(`/admin/memewar/end/${warId}`, { method: 'POST', body: JSON.stringify({ winnerId, winnerAnnouncement }) }),

    // Troll of Week
    selectTrollOfWeek: (trollId: string, responseId: string, winnerUserId: string) =>
        apiRequest('/admin/troll-of-week', { method: 'POST', body: JSON.stringify({ trollId, responseId, winnerUserId }) }),

    // Post Promotion
    promotePost: (postId: string, promote = true) =>
        apiRequest(`/admin/promote/${postId}`, { method: 'POST', body: JSON.stringify({ promote }) }),

    // Broadcast
    broadcast: (message: string) =>
        apiRequest('/admin/broadcast', { method: 'POST', body: JSON.stringify({ message }) }),

    // Admin Accounts
    getAccounts: () => apiRequest('/admin/accounts'),
    createAccount: (data: { displayName: string; email: string; password: string }) =>
        apiRequest('/admin/accounts', { method: 'POST', body: JSON.stringify(data) }),
    updateAccount: (accountId: string, displayName: string) =>
        apiRequest(`/admin/accounts/${accountId}`, { method: 'PUT', body: JSON.stringify({ displayName }) }),
    deleteAccount: (accountId: string) =>
        apiRequest(`/admin/accounts/${accountId}`, { method: 'DELETE' }),
    initializeAccounts: (basePassword: string) =>
        apiRequest('/admin/initialize-accounts', { method: 'POST', body: JSON.stringify({ basePassword }) }),

    // Moderation
    getAllPosts: (limit = 50) => apiRequest(`/admin/posts?limit=${limit}`),
    deletePost: (postId: string) => apiRequest(`/admin/posts/${postId}`, { method: 'DELETE' }),
    featureUser: (userId: string) => apiRequest(`/users/${userId}/feature`, { method: 'POST' }),
    getAllUsers: (limit = 50) => apiRequest(`/admin/users?limit=${limit}`),
};

// Ads API
export const adsAPI = {
    getAds: () => apiRequest('/ads'),
    createAd: (data: { title: string; content: string; imageURL?: string; linkURL?: string }) =>
        apiRequest('/ads', { method: 'POST', body: JSON.stringify(data) }),
    deleteAd: (adId: string) => apiRequest(`/ads/${adId}`, { method: 'DELETE' }),
};
