export type UserRole = 'STUDENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type TimeMode = 'RANGE' | 'FLEXIBLE';
export type IntentStatus = 'ACTIVE' | 'MATCHED' | 'CANCELLED' | 'EXPIRED';
export type GroupStatus = 'OPEN' | 'PLANNING' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'CLOSED';
export type MemberRole = 'LEADER' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';
export type TripStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface College {
  id: string;
  name: string;
  emailDomain: string;
  logo?: string;
  status?: string;
  _count?: { users: number; locations: number };
}

export interface Location {
  id: string;
  collegeId: string;
  name: string;
  description?: string;
  type: 'CAMPUS' | 'POPULAR';
  active: boolean;
  college?: { name: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  collegeId: string;
  course?: string;
  year?: string;
  isVerified: boolean;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  college: College;
  rating?: number;
  ratingCount?: number;
  completedTripsCount?: number;
}

export interface TravelIntent {
  id: string;
  creatorId: string;
  fromLocationId: string;
  toLocationId: string;
  date: string;
  timeMode: TimeMode;
  startTime?: string;
  endTime?: string;
  preferredTime?: string;
  flexibilityMinutes?: number;
  effectiveStart: string;
  effectiveEnd: string;
  note?: string;
  status: IntentStatus;
  createdAt: string;
  fromLocation: Location;
  toLocation: Location;
  creator: {
    id: string;
    name: string;
    isVerified: boolean;
    course?: string;
    year?: string;
    profilePhoto?: string;
  };
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    profilePhoto?: string;
    isVerified: boolean;
    course?: string;
    year?: string;
  };
}

export interface Message {
  id: string;
  groupId: string;
  senderId?: string | null;
  content: string;
  isSystemMessage: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    profilePhoto?: string;
  } | null;
}

export interface TravelGroup {
  id: string;
  collegeId: string;
  fromLocationId: string;
  toLocationId: string;
  date: string;
  commonTime?: string;
  meetingPointId?: string;
  status: GroupStatus;
  createdAt: string;
  fromLocation: Location;
  toLocation: Location;
  meetingPoint?: Location;
  members: GroupMember[];
  messages?: Message[];
  trips?: Trip[];
  isMember?: boolean;
}

export interface Trip {
  id: string;
  groupId: string;
  status: TripStatus;
  scheduledTime: string;
  startedAt?: string;
  completedAt?: string;
  group?: TravelGroup;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: any;
  readAt?: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  groupId?: string;
  category: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  reporter: { name: string; email: string };
  reportedUser?: { name: string; email: string };
  group?: { date: string; fromLocation: Location; toLocation: Location };
}

export interface MatchScoreResult {
  score: number;
  label: 'Strong Match' | 'Good Match' | 'Possible Match';
  reasons: string[];
  overlapMinutes: number;
}
