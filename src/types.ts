import { Timestamp } from 'firebase/firestore';

export interface GroupSettings {
  onlyAdminsCanAdd: boolean;
  onlyAdminsCanEdit: boolean;
}

export interface GroupChatDoc {
  id: string;
  type: 'group';
  name: string;
  description?: string;
  avatar: string;
  createdBy: string;
  createdAt: any; // Timestamp or FieldValue
  updatedAt: any;
  admins: string[];
  members: string[];
  participants: string[]; // For backward-compatible queries
  settings: GroupSettings;
  lastMessage?: {
    text: string;
    createdAt: any;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
  };
}

export interface GroupMemberKey {
  userId: string;
  publicKey: string; // JWK representation of ECDH public key
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: 'text' | 'image' | 'audio' | 'sticker' | 'system';
  mediaUrl?: string;
  createdAt: any;
  isEncrypted?: boolean;
  encryptedData?: {
    iv: number[];
    data: number[];
  };
  encryptedKeys?: {
    [userId: string]: {
      iv: number[];
      data: number[];
    };
  };
}

export interface PeaceSchedule {
  enabled: boolean;
  daily: { start: string; end: string };
  weekend?: { start: string; end: string };
}

export interface PeaceModeSettings {
  enabled: boolean;
  autoReplyText: string;
  messageLimit: number;
  focusTimer: number;
  schedule?: PeaceSchedule;
  zenTheme: string; // 'blue' | 'green' | 'purple'
  onlyCloseFriendsMessage?: boolean;
}

export interface PeaceStats {
  date: string;
  minutesInPeaceMode: number;
  messagesSent: number;
  focusSessions: number;
  notificationsBlocked: number;
  peaceScore: number;
}

export interface Monetization {
  enabled: boolean;
  price: number;
  currency: string;
  revenue: number;
  payoutPending: number;
}

export interface ChannelSettings {
  allowComments: boolean;
  slowMode: number;
  requireApproval: boolean;
}

export interface Channel {
  id: string;
  name: string;
  handle: string;
  description: string;
  avatar?: string;
  ownerId: string;
  admins: string[];
  editors?: string[];
  createdAt: Timestamp;
  privacy: 'public' | 'private';
  inviteLink: string;
  subscribers: number;
  monetization: Monetization;
  settings: ChannelSettings;
  category?: string;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  type: 'text' | 'photo' | 'video' | 'file' | 'poll' | 'forward';
  content: string;
  mediaUrl?: string;
  fileName?: string;
  createdAt: Timestamp;
  views: number;
  reactions: { [emoji: string]: number };
  comments: number;
  isPaidOnly: boolean;
  forwardedFrom?: string;
  options?: string[];
  votes?: { [userId: string]: number };
  disallowForwarding?: boolean;
}

export interface ChannelComment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  replyTo?: string;
  createdAt: Timestamp;
  userName: string;
  userAvatar?: string;
}

// --- Enclave Map Privacy-First Location Sharing Types ---
export type LocationMode = 'ghost' | 'contacts' | 'select';

export interface LocationSettings {
  mode: LocationMode;
  allowedFriends: string[];
  preciseLocation: boolean;
  batterySaver: boolean;
  updatedAt: Timestamp;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  city: string;
  updatedAt: Timestamp;
}

export interface MapFriend {
  userId: string;
  name: string;
  avatar: string;
  lat: number;
  lng: number;
  lastActive: Timestamp;
  distance: number;
  storyAvailable?: boolean;
  storyContent?: string;
  storyTime?: Timestamp;
}

export interface TripShare {
  id: string;
  sharedWith: string;
  start: UserLocation;
  end: UserLocation;
  route: UserLocation[];
  startedAt: Timestamp;
  expiresAt: Timestamp;
  completed?: boolean;
}

export interface ReelMusic {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
  duration: number;
  trending: boolean;
  useCount: number;
}

export interface Reel {
  id: string;
  creatorId: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  music?: ReelMusic;
  filters: string[];
  effects: string[];
  duration: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  createdAt: Timestamp;
  hashtags: string[];
  isPublic: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  creatorName?: string;
  creatorAvatar?: string;
  // duet/stitch metadata
  isDuet?: boolean;
  duetParentId?: string;
  isStitch?: boolean;
  stitchParentId?: string;
}

export interface ReelComment {
  id: string;
  reelId: string;
  userId: string;
  text: string;
  likes: number;
  isPinned: boolean;
  createdAt: Timestamp;
  userName?: string;
  userAvatar?: string;
}

export interface ReelAnalytics {
  reelId: string;
  views: number;
  watchTime: number;
  likes: number;
  shares: number;
  saves: number;
  followerGain: number;
  demographics: {
    age: number[];
    gender: number[];
    countries: string[];
  };
}// --- Close Friends Types ---
export interface CloseFriend {
  userId: string;
  addedAt: Timestamp;
  addedBy: 'manual' | 'ai-suggested';
}

export interface CloseFriendSuggestion {
  userId: string;
  reason: string;
  score: number;
  metrics: {
    messageCount: number;
    callMinutes: number;
    storyViews: number;
  };
}

// --- Live Streaming Types ---
export interface StreamSettings {
  allowComments: boolean;
  allowTips: boolean;
  aiModeration: boolean;
  aiTranslation: boolean;
  safeMode: boolean;
}

export interface LiveStream {
  id: string;
  title: string;
  hostId: string;
  cohosts: string[];
  status: 'scheduled' | 'live' | 'ended';
  visibility: 'public' | 'followers' | 'close_friends' | 'paid';
  category: string;
  thumbnail: string;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  viewerCount: number;
  maxViewers: number;
  totalTips: number;
  ticketPrice?: number;
  settings: StreamSettings;
}

export interface StreamComment {
  id: string;
  streamId: string;
  userId: string;
  text: string;
  timestamp: Timestamp;
  isFlagged: boolean;
}

export interface StreamTip {
  id: string;
  streamId: string;
  userId: string;
  amount: number;
  message?: string;
  timestamp: Timestamp;
}

// --- Music Types ---
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  addedBy: string;
  addedAt: Timestamp;
  votes: number;
}

export interface PlaylistSettings {
  allowOthersAdd: boolean;
  voteToReorder: boolean;
  maxSongs: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  createdBy: string;
  chatId: string;
  songs: Song[];
  settings: PlaylistSettings;
  createdAt: Timestamp;
}

export interface NowPlaying {
  song: Song;
  position: number;
  isPlaying: boolean;
  hostId: string;
  listeners: string[];
}

// --- Reaction & Super Reaction Types ---
export type ReactionType = 'standard' | 'super' | 'custom';

export interface Reaction {
  emoji: string;
  type: ReactionType;
  animation?: string;
  sound?: string;
  isPremium: boolean;
}

export interface MessageReaction {
  id?: string;
  messageId: string;
  userId: string;
  emoji: string;
  type: ReactionType;
  createdAt: any; // Timestamp or similar
}

export interface ReactionQuota {
  remaining: number;
  resetAt: any; // Timestamp
  totalUsed: number;
  isPremium: boolean;
}

