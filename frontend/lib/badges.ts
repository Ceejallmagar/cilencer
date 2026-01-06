export const BADGES_LIST = [
    { id: "meme_flower", name: "Flower", icon: "🌸", image: "/badges/flower_badge.png", type: "frame", requirement: "Post 100 memes" },
    { id: "meme_star", name: "Star", icon: "⭐", requirement: "Post 500 memes" },
    { id: "meme_crown", name: "Crown", icon: "👑", requirement: "Post 1000 memes" },
    { id: "admin_badge", name: "Admin", icon: "🛡️", requirement: "Be an admin" },
    { id: "fire_badge", name: "Fire", icon: "🔥", requirement: "Win a Meme War" },
    { id: "first_meme", name: "First Meme", icon: "🎉", requirement: "Post your first meme" },
    { id: "troll_master", name: "Troll Master", icon: "🤡", requirement: "Win Troll of the Week" },
    { id: "diamond", name: "Diamond", icon: "💎", requirement: "Reach Position #1" },
    { id: "lightning", name: "Lightning", icon: "⚡", requirement: "Get 100 likes on one post" },
    { id: "skull", name: "Savage", icon: "💀", requirement: "Win 10 Meme Wars" },
    { id: "rainbow", name: "Rainbow", icon: "🌈", requirement: "Post in all categories" },
    { id: "rocket", name: "Rocket", icon: "🚀", requirement: "Get featured by admin" },
    { id: "heart", name: "Loved", icon: "❤️", requirement: "Get 1000 total likes" },
];

export const getBadgeEmoji = (badgeId: string | null | undefined): string => {
    if (!badgeId) return "";
    const badge = BADGES_LIST.find(b => b.id === badgeId);
    return badge ? badge.icon : "🏅";
};

export const getBadgeImage = (badgeId: string | null | undefined): string | undefined => {
    if (!badgeId) return undefined;
    const badge = BADGES_LIST.find(b => b.id === badgeId);
    return badge?.image;
};

export const getBadgeName = (badgeId: string): string => {
    const badge = BADGES_LIST.find(b => b.id === badgeId);
    return badge ? badge.name : badgeId.replace(/_/g, " ");
};
export const getBadgeType = (badgeId: string | null | undefined): string | undefined => {
    if (!badgeId) return undefined;
    const badge = BADGES_LIST.find(b => b.id === badgeId);
    return badge?.type;
};
