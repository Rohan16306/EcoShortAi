'use client';

// Real-time pickup request store using localStorage + BroadcastChannel
// This acts as the shared state layer between user and collector interfaces

export type RequestStatus =
  | 'pending' |'accepted' |'on-the-way' |'arrived' |'collected' |'completed' |'rejected';

export interface PickupRequest {
  id: string;
  userName: string;
  phone: string;
  address: string;
  area: string;
  wasteType: string;
  estimatedKg: number;
  preferredTime: string;
  distance: string;
  lat: number;
  lng: number;
  submittedAt: string;
  status: RequestStatus;
  notes?: string;
  collectorId?: string;
  collectorName?: string;
  collectorPhone?: string;
  collectorRating?: number;
  collectorVehicle?: string;
  acceptedAt?: string;
  completedAt?: string;
  userRating?: number;
  creditsAwarded?: number;
  collectorCreditsAwarded?: number;
}

export interface CollectorSession {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalPickups: number;
  vehicleType: string;
  serviceArea: string;
  initials: string;
}

// ─── Account Registry (gated auth) ───────────────────────────────────────────

export interface RegisteredAccount {
  id: string;
  email: string;
  password: string; // stored as plain text (client-only demo — no real backend)
  role: 'user' | 'collector';
  fullName: string;
  phone: string;
  vehicleType?: string;
  serviceArea?: string;
  createdAt: string;
}

const ACCOUNTS_KEY = 'wastepickup_accounts';

export function getAllAccounts(): RegisteredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerAccount(account: RegisteredAccount): void {
  if (typeof window === 'undefined') return;
  const all = getAllAccounts();
  all.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all));
}

export function findAccount(email: string, role: 'user' | 'collector'): RegisteredAccount | null {
  const all = getAllAccounts();
  return all.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.role === role) ?? null;
}

export function accountExists(email: string, role: 'user' | 'collector'): boolean {
  return findAccount(email, role) !== null;
}

// ─── Notification Store ───────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  requestId: string;
  type: 'accepted' | 'on-the-way' | 'arrived' | 'collected' | 'completed' | 'submitted';
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const NOTIFICATIONS_KEY = 'wastepickup_notifications';

export function getNotifications(requestId?: string): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    return requestId ? all.filter((n) => n.requestId === requestId) : all;
  } catch {
    return [];
  }
}

export function addNotification(notif: AppNotification): void {
  if (typeof window === 'undefined') return;
  const all = getNotifications();
  // Avoid duplicate notifications for same request+type
  const exists = all.some((n) => n.requestId === notif.requestId && n.type === notif.type);
  if (exists) return;
  all.unshift(notif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  broadcastUpdate({ type: 'NOTIFICATION_ADDED', notification: notif });
}

export function markNotificationsRead(requestId: string): void {
  if (typeof window === 'undefined') return;
  const all = getNotifications();
  const updated = all.map((n) => (n.requestId === requestId ? { ...n, read: true } : n));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

// ─── Request CRUD ────────────────────────────────────────────────────────────

const REQUESTS_KEY = 'wastepickup_requests';
const COLLECTOR_SESSION_KEY = 'wastepickup_collector_session';
const BROADCAST_CHANNEL = 'wastepickup_realtime';

export function getAllRequests(): PickupRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRequest(req: PickupRequest): void {
  if (typeof window === 'undefined') return;
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === req.id);
  if (idx >= 0) {
    all[idx] = req;
  } else {
    all.unshift(req);
  }
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  broadcastUpdate({ type: 'REQUEST_UPDATED', request: req });
}

export function addRequest(req: PickupRequest): void {
  if (typeof window === 'undefined') return;
  const all = getAllRequests();
  all.unshift(req);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  broadcastUpdate({ type: 'REQUEST_ADDED', request: req });
  // Add submitted notification
  addNotification({
    id: `notif-${req.id}-submitted`,
    requestId: req.id,
    type: 'submitted',
    title: 'Request submitted successfully',
    desc: `Your ${req.wasteType} pickup request was submitted. Nearby collectors are being notified.`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  });
}

export function updateRequestStatus(
  id: string,
  status: RequestStatus,
  collectorInfo?: Partial<PickupRequest>
): PickupRequest | null {
  if (typeof window === 'undefined') return null;
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status, ...collectorInfo };
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  broadcastUpdate({ type: 'STATUS_CHANGED', request: all[idx] });

  // Auto-generate milestone notifications
  const req = all[idx];
  const milestoneNotifs: Record<string, { title: string; desc: string }> = {
    accepted: {
      title: '✅ Collector accepted your request!',
      desc: `${req.collectorName ?? 'A collector'} has accepted your ${req.wasteType} pickup. They will head to your location shortly.`,
    },
    'on-the-way': {
      title: '🚛 Collector is on the way!',
      desc: `${req.collectorName ?? 'Your collector'} has started traveling to your location. Please be ready.`,
    },
    arrived: {
      title: '📍 Collector has arrived!',
      desc: `${req.collectorName ?? 'Your collector'} has reached your location. Please hand over the waste.`,
    },
    collected: {
      title: '♻️ Waste has been collected!',
      desc: `${req.collectorName ?? 'Your collector'} has collected your ${req.wasteType}. Please confirm the pickup.`,
    },
    completed: {
      title: '🎉 Pickup completed!',
      desc: `Your ${req.wasteType} pickup is complete. Thank you for contributing to a cleaner city!`,
    },
  };

  if (milestoneNotifs[status]) {
    addNotification({
      id: `notif-${id}-${status}`,
      requestId: id,
      type: status as AppNotification['type'],
      title: milestoneNotifs[status].title,
      desc: milestoneNotifs[status].desc,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    });
  }

  // Award credits if completed and not already awarded
  if (status === 'completed' && !req.creditsAwarded) {
    const userCredits = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
    const collectorCredits = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
    all[idx].creditsAwarded = userCredits;
    all[idx].collectorCreditsAwarded = collectorCredits;
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));

    // Notify user of credits
    addNotification({
      id: `notif-${id}-user-credits`,
      requestId: id,
      type: 'completed',
      title: `🎁 You earned ${userCredits} credits!`,
      desc: `${userCredits} eco-credits were awarded for your ${req.wasteType} pickup. Check your Rewards tab!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    });
  }

  return all[idx];
}

export function getPendingRequests(): PickupRequest[] {
  return getAllRequests().filter((r) => r.status === 'pending');
}

export function getRequestById(id: string): PickupRequest | null {
  return getAllRequests().find((r) => r.id === id) ?? null;
}

// ─── Collector Session ────────────────────────────────────────────────────────

export function getCollectorSession(): CollectorSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COLLECTOR_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCollectorSession(session: CollectorSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COLLECTOR_SESSION_KEY, JSON.stringify(session));
}

export function clearCollectorSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COLLECTOR_SESSION_KEY);
}

// ─── Broadcast (real-time cross-tab sync) ────────────────────────────────────

type BroadcastMessage =
  | { type: 'REQUEST_ADDED'; request: PickupRequest }
  | { type: 'REQUEST_UPDATED'; request: PickupRequest }
  | { type: 'STATUS_CHANGED'; request: PickupRequest }
  | { type: 'NOTIFICATION_ADDED'; notification: AppNotification };

function broadcastUpdate(msg: BroadcastMessage): void {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.postMessage(msg);
    channel.close();
  } catch {
    // BroadcastChannel not supported — localStorage polling will handle it
  }
}

export function subscribeToBroadcast(
  callback: (msg: BroadcastMessage) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.onmessage = (e) => callback(e.data as BroadcastMessage);
    return () => channel.close();
  } catch {
    return () => {};
  }
}

// ─── Collector Stats ──────────────────────────────────────────────────────────

export function getCollectorStats(collectorId: string) {
  const all = getAllRequests();
  const mine = all.filter((r) => r.collectorId === collectorId);
  const today = new Date().toDateString();
  const todayPickups = mine.filter(
    (r) => r.status === 'completed' && r.completedAt && new Date(r.completedAt).toDateString() === today
  ).length;
  const completed = mine.filter((r) => r.status === 'completed');
  const totalKg = completed.reduce((sum, r) => sum + (Number(r.estimatedKg) || 0), 0);
  return {
    todayPickups,
    totalCompleted: completed.length,
    totalKg,
  };
}

// ─── Rating System ────────────────────────────────────────────────────────────

export function addRating(requestId: string, rating: number): void {
  if (typeof window === 'undefined') return;
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return;
  all[idx] = { ...all[idx], userRating: rating };
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  broadcastUpdate({ type: 'REQUEST_UPDATED', request: all[idx] });
}

export function getCollectorAverageRating(collectorId: string): { average: number; count: number } {
  const all = getAllRequests();
  const rated = all.filter(
    (r) => r.collectorId === collectorId && r.userRating != null && r.userRating > 0
  );
  if (rated.length === 0) return { average: 0, count: 0 };
  const sum = rated.reduce((s, r) => s + (r.userRating ?? 0), 0);
  return {
    average: Math.round((sum / rated.length) * 10) / 10,
    count: rated.length,
  };
}

// ─── Credit System ────────────────────────────────────────────────────────────

export function awardCredits(requestId: string, credits: number): void {
  if (typeof window === 'undefined') return;
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return;
  all[idx] = { ...all[idx], creditsAwarded: credits };
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  broadcastUpdate({ type: 'REQUEST_UPDATED', request: all[idx] });

  // Add credit notification for the user
  addNotification({
    id: `notif-${requestId}-credits`,
    requestId,
    type: 'completed',
    title: `🎁 You earned ${credits} credits!`,
    desc: `${credits} eco-credits were awarded for your ${all[idx].wasteType} pickup. Check your Rewards tab!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  });
}

export function getUserCredits(userId: string): number {
  const all = getAllRequests();
  // Match by userName or phone (since we don't have a proper userId on requests)
  const authRaw = typeof window !== 'undefined' ? localStorage.getItem('wastepickup_auth') : null;
  let userPhone = '';
  let userName = '';
  let userRole = '';
  if (authRaw) {
    try {
      const auth = JSON.parse(authRaw);
      userPhone = auth.phone ?? '';
      userName = auth.fullName ?? '';
      userRole = auth.role ?? '';
    } catch { /* ignore */ }
  }

  let totalEarned = 0;

  if (userRole === 'collector' || userRole === 'ROLE_RECEIVER') {
    const collectorSession = getCollectorSession();
    const myRequests = all.filter(
      (r) => r.collectorId === collectorSession?.id && r.collectorCreditsAwarded != null && r.collectorCreditsAwarded > 0
    );
    totalEarned = myRequests.reduce((sum, r) => sum + (r.collectorCreditsAwarded ?? 0), 0);
  } else {
    const myRequests = all.filter(
      (r) => (r.phone === userPhone || r.userName === userName) && r.creditsAwarded != null && r.creditsAwarded > 0
    );
    totalEarned = myRequests.reduce((sum, r) => sum + (r.creditsAwarded ?? 0), 0);
  }

  // Subtract claimed rewards
  const claimed = getUserClaimedRewards(userId);
  const totalSpent = claimed.reduce((sum, c) => sum + c.creditsCost, 0);

  return totalEarned - totalSpent;
}

export function getUserCreditHistory(userId: string): Array<{
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  date: string;
}> {
  const all = getAllRequests();
  const authRaw = typeof window !== 'undefined' ? localStorage.getItem('wastepickup_auth') : null;
  let userPhone = '';
  let userName = '';
  let userRole = '';
  if (authRaw) {
    try {
      const auth = JSON.parse(authRaw);
      userPhone = auth.phone ?? '';
      userName = auth.fullName ?? '';
      userRole = auth.role ?? '';
    } catch { /* ignore */ }
  }

  const history: Array<{
    id: string;
    type: 'earned' | 'spent';
    amount: number;
    description: string;
    date: string;
  }> = [];

  // Earned credits
  if (userRole === 'collector' || userRole === 'ROLE_RECEIVER') {
    const collectorSession = getCollectorSession();
    all.filter(
      (r) => r.collectorId === collectorSession?.id && r.collectorCreditsAwarded != null && r.collectorCreditsAwarded > 0
    ).forEach((r) => {
      history.push({
        id: `earned-${r.id}`,
        type: 'earned',
        amount: r.collectorCreditsAwarded!,
        description: `Completed pickup: ${r.wasteType} (${r.estimatedKg} kg)`,
        date: r.completedAt ?? r.submittedAt,
      });
    });
  } else {
    all.filter(
      (r) => (r.phone === userPhone || r.userName === userName) && r.creditsAwarded != null && r.creditsAwarded > 0
    ).forEach((r) => {
      history.push({
        id: `earned-${r.id}`,
        type: 'earned',
        amount: r.creditsAwarded!,
        description: `${r.wasteType} pickup — ${r.estimatedKg} kg collected`,
        date: r.completedAt ?? r.submittedAt,
      });
    });
  }

  // Spent credits (claimed rewards)
  const claimed = getUserClaimedRewards(userId);
  claimed.forEach((c) => {
    history.push({
      id: `spent-${c.id}`,
      type: 'spent',
      amount: c.creditsCost,
      description: `Claimed: ${c.rewardName}`,
      date: c.claimedAt,
    });
  });

  // Sort newest first
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return history;
}

// ─── Rewards System ───────────────────────────────────────────────────────────

export interface Reward {
  id: string;
  name: string;
  description: string;
  creditsCost: number;
  icon: string;
  category: 'voucher' | 'service' | 'impact';
}

export interface ClaimedReward {
  id: string;
  rewardId: string;
  rewardName: string;
  creditsCost: number;
  claimedAt: string;
}

const CLAIMED_REWARDS_KEY = 'wastepickup_claimed_rewards';

export function getRewardsCatalog(): Reward[] {
  return [
    {
      id: 'reward-1',
      name: '₹50 Amazon Voucher',
      description: 'Redeem an Amazon gift card worth ₹50',
      creditsCost: 100,
      icon: '🛒',
      category: 'voucher',
    },
    {
      id: 'reward-2',
      name: 'Free Pickup',
      description: 'Your next waste pickup is completely free',
      creditsCost: 50,
      icon: '🚛',
      category: 'service',
    },
    {
      id: 'reward-3',
      name: 'Plant a Tree',
      description: 'We plant a tree in your name for the environment',
      creditsCost: 75,
      icon: '🌳',
      category: 'impact',
    },
    {
      id: 'reward-4',
      name: '₹100 Swiggy Voucher',
      description: 'Get a Swiggy food delivery voucher worth ₹100',
      creditsCost: 200,
      icon: '🍔',
      category: 'voucher',
    },
    {
      id: 'reward-5',
      name: 'Eco Badge',
      description: 'Unlock a special Eco Warrior badge on your profile',
      creditsCost: 25,
      icon: '🏅',
      category: 'impact',
    },
    {
      id: 'reward-6',
      name: 'Priority Pickup',
      description: 'Get priority scheduling for your next 3 pickups',
      creditsCost: 150,
      icon: '⚡',
      category: 'service',
    },
  ];
}

export function claimReward(userId: string, rewardId: string): boolean {
  if (typeof window === 'undefined') return false;
  const catalog = getRewardsCatalog();
  const reward = catalog.find((r) => r.id === rewardId);
  if (!reward) return false;

  const balance = getUserCredits(userId);
  if (balance < reward.creditsCost) return false;

  const claimed = getUserClaimedRewards(userId);
  const newClaim: ClaimedReward = {
    id: `claim-${Date.now()}`,
    rewardId: reward.id,
    rewardName: reward.name,
    creditsCost: reward.creditsCost,
    claimedAt: new Date().toISOString(),
  };
  claimed.push(newClaim);
  localStorage.setItem(CLAIMED_REWARDS_KEY, JSON.stringify(claimed));
  broadcastUpdate({ type: 'REQUEST_UPDATED', request: {} as PickupRequest }); // trigger refresh
  return true;
}

export function getUserClaimedRewards(userId: string): ClaimedReward[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLAIMED_REWARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
