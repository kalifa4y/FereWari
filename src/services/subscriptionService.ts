import { db, AppSettings } from '../db/db';

export const MONTHLY_PRICE_FCFA = 5000;
export const TRIAL_DAYS = 15;
export const GRACE_DAYS = 10;

export interface SubscriptionStatusInfo {
  status: 'trial' | 'grace_period' | 'active' | 'expired';
  daysRemainingInTrial: number;
  daysRemainingInGrace: number;
  graceDeadlineFormatted: string;
  isLocked: boolean;
  showGraceBanner: boolean;
  shouldShowReminderModal: boolean;
  expiresAtFormatted?: string;
}

/**
 * Format a date in French long format e.g. "Mardi 24 Mars 2026"
 */
export function formatFrenchDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Evaluates the subscription status based on stored AppSettings.
 */
export function evaluateSubscription(settings?: AppSettings): SubscriptionStatusInfo {
  if (!settings) {
    return {
      status: 'trial',
      daysRemainingInTrial: TRIAL_DAYS,
      daysRemainingInGrace: GRACE_DAYS,
      graceDeadlineFormatted: '',
      isLocked: false,
      showGraceBanner: false,
      shouldShowReminderModal: false
    };
  }

  const now = new Date();

  // 1. Check Active Paid Subscription
  if (settings.subscriptionStatus === 'active') {
    const expiresAt = settings.subscriptionExpiresAt ? new Date(settings.subscriptionExpiresAt) : null;
    if (expiresAt && expiresAt > now) {
      return {
        status: 'active',
        daysRemainingInTrial: 0,
        daysRemainingInGrace: 0,
        graceDeadlineFormatted: '',
        isLocked: false,
        showGraceBanner: false,
        shouldShowReminderModal: false,
        expiresAtFormatted: capitalize(formatFrenchDate(expiresAt))
      };
    }
    // Subscription expired -> falls back to expired
  }

  // 2. Explicit Dev/Admin Forced Status
  if (settings.subscriptionStatus === 'expired') {
    return {
      status: 'expired',
      daysRemainingInTrial: 0,
      daysRemainingInGrace: 0,
      graceDeadlineFormatted: '',
      isLocked: true,
      showGraceBanner: false,
      shouldShowReminderModal: false
    };
  }

  // 3. Time-based calculation from trialStartDate
  const trialStart = new Date(settings.trialStartDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.floor((now.getTime() - trialStart.getTime()) / msPerDay);

  const graceEnd = new Date(trialStart.getTime() + (TRIAL_DAYS + GRACE_DAYS) * msPerDay);

  if (elapsedDays < TRIAL_DAYS) {
    // In Trial
    const daysLeft = TRIAL_DAYS - elapsedDays;
    return {
      status: 'trial',
      daysRemainingInTrial: daysLeft,
      daysRemainingInGrace: GRACE_DAYS,
      graceDeadlineFormatted: capitalize(formatFrenchDate(graceEnd)),
      isLocked: false,
      showGraceBanner: false,
      shouldShowReminderModal: false
    };
  } else if (elapsedDays < TRIAL_DAYS + GRACE_DAYS) {
    // In Grace Period (10 days)
    const daysLeftInGrace = Math.max(1, (TRIAL_DAYS + GRACE_DAYS) - elapsedDays);
    const dayInGrace = elapsedDays - TRIAL_DAYS;
    // Show reminder modal every 2 days
    const shouldShowReminder = dayInGrace % 2 === 0;

    return {
      status: 'grace_period',
      daysRemainingInTrial: 0,
      daysRemainingInGrace: daysLeftInGrace,
      graceDeadlineFormatted: capitalize(formatFrenchDate(graceEnd)),
      isLocked: false,
      showGraceBanner: true,
      shouldShowReminderModal: shouldShowReminder
    };
  } else {
    // Expired -> Lock operational views
    return {
      status: 'expired',
      daysRemainingInTrial: 0,
      daysRemainingInGrace: 0,
      graceDeadlineFormatted: capitalize(formatFrenchDate(graceEnd)),
      isLocked: true,
      showGraceBanner: false,
      shouldShowReminderModal: false
    };
  }
}

/**
 * Activates or renews the subscription for 30 days.
 */
export async function activateSubscription(days = 30): Promise<void> {
  const settings = await db.settings.get('current_user_profile');
  const now = new Date();
  const currentExpires = settings?.subscriptionExpiresAt ? new Date(settings.subscriptionExpiresAt) : now;
  const baseDate = currentExpires > now ? currentExpires : now;

  const newExpires = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  await db.settings.update('current_user_profile', {
    subscriptionStatus: 'active',
    subscriptionExpiresAt: newExpires
  });
}

/**
 * Dev/Demo switcher to test different subscription states instantly.
 */
export async function simulateSubscriptionState(target: 'trial' | 'grace_period' | 'active' | 'expired'): Promise<void> {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;

  if (target === 'trial') {
    await db.settings.update('current_user_profile', {
      trialStartDate: now,
      subscriptionStatus: 'trial',
      subscriptionExpiresAt: undefined
    });
  } else if (target === 'grace_period') {
    // Start was 18 days ago (3 days into 10-day grace period)
    const simulatedStart = new Date(now.getTime() - 18 * msPerDay);
    await db.settings.update('current_user_profile', {
      trialStartDate: simulatedStart,
      subscriptionStatus: 'grace_period',
      subscriptionExpiresAt: undefined
    });
  } else if (target === 'expired') {
    // Start was 30 days ago (grace period ended)
    const simulatedStart = new Date(now.getTime() - 30 * msPerDay);
    await db.settings.update('current_user_profile', {
      trialStartDate: simulatedStart,
      subscriptionStatus: 'expired',
      subscriptionExpiresAt: undefined
    });
  } else if (target === 'active') {
    const expiresAt = new Date(now.getTime() + 30 * msPerDay);
    await db.settings.update('current_user_profile', {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt
    });
  }
}
