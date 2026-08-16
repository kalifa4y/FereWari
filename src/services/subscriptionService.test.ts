import { evaluateSubscription } from './subscriptionService';
import { AppSettings } from '../db/db';

export function runSubscriptionTests() {
  console.log('🧪 Running Subscription Service Tests...');

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;

  // Test 1: Day 5 of Trial
  const trialStart = new Date(now.getTime() - 5 * msPerDay);
  const trialSettings: AppSettings = {
    id: 'current_user_profile',
    userName: 'Test Artisan',
    trialStartDate: trialStart,
    subscriptionStatus: 'trial',
    googleDriveConnected: false
  };

  const trialRes = evaluateSubscription(trialSettings);
  if (trialRes.status !== 'trial' || trialRes.isLocked || trialRes.showGraceBanner) {
    throw new Error(`Expected trial status, got ${JSON.stringify(trialRes)}`);
  }
  if (trialRes.daysRemainingInTrial !== 10) {
    throw new Error(`Expected 10 days left in trial, got ${trialRes.daysRemainingInTrial}`);
  }

  // Test 2: Day 18 (Day 3 of Grace Period)
  const graceStart = new Date(now.getTime() - 18 * msPerDay);
  const graceSettings: AppSettings = {
    id: 'current_user_profile',
    userName: 'Test Artisan',
    trialStartDate: graceStart,
    subscriptionStatus: 'grace_period',
    googleDriveConnected: false
  };

  const graceRes = evaluateSubscription(graceSettings);
  if (graceRes.status !== 'grace_period' || graceRes.isLocked || !graceRes.showGraceBanner) {
    throw new Error(`Expected grace_period status with banner, got ${JSON.stringify(graceRes)}`);
  }
  if (graceRes.daysRemainingInGrace !== 7) {
    throw new Error(`Expected 7 days remaining in grace, got ${graceRes.daysRemainingInGrace}`);
  }

  // Test 3: Day 30 (Grace Period Ended -> Expired / Locked)
  const expiredStart = new Date(now.getTime() - 30 * msPerDay);
  const expiredSettings: AppSettings = {
    id: 'current_user_profile',
    userName: 'Test Artisan',
    trialStartDate: expiredStart,
    subscriptionStatus: 'expired',
    googleDriveConnected: false
  };

  const expiredRes = evaluateSubscription(expiredSettings);
  if (expiredRes.status !== 'expired' || !expiredRes.isLocked) {
    throw new Error(`Expected expired status and locked interface, got ${JSON.stringify(expiredRes)}`);
  }

  // Test 4: Active Paid Subscription
  const futureDate = new Date(now.getTime() + 20 * msPerDay);
  const activeSettings: AppSettings = {
    id: 'current_user_profile',
    userName: 'Test Artisan',
    trialStartDate: expiredStart,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: futureDate,
    googleDriveConnected: false
  };

  const activeRes = evaluateSubscription(activeSettings);
  if (activeRes.status !== 'active' || activeRes.isLocked || activeRes.showGraceBanner) {
    throw new Error(`Expected active subscription, got ${JSON.stringify(activeRes)}`);
  }

  console.log('✅ Subscription Service Tests Passed!');
}
