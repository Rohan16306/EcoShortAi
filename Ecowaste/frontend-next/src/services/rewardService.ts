export interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  role: string;
  inStock: boolean;
}

export interface ClaimedItem {
  id: string;
  rewardId: string;
  title: string;
  cost: number;
  couponCode: string;
  validUntil: string;
  claimedAt: string;
}

export async function fetchRewards(token: string): Promise<{ rewards: RewardItem[], credits: number }> {
  const res = await fetch('/api/rewards', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch rewards');
  }
  return res.json();
}

export async function redeemReward(token: string, rewardId: string): Promise<{ success: boolean, couponCode: string, newBalance: number, claimedItem: ClaimedItem, error?: string }> {
  const res = await fetch('/api/rewards/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rewardId })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to redeem reward');
  }
  return res.json();
}

export async function fetchRewardHistory(token: string): Promise<{ history: ClaimedItem[] }> {
  const res = await fetch('/api/rewards/history', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch reward history');
  }
  return res.json();
}
