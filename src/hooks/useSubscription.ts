import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { evaluateSubscription, SubscriptionStatusInfo } from '../services/subscriptionService';

export function useSubscription(): {
  subscriptionInfo: SubscriptionStatusInfo;
  isLoading: boolean;
  settings?: any;
} {
  const settings = useLiveQuery(() => db.settings.get('current_user_profile'), []);

  const subscriptionInfo = evaluateSubscription(settings);

  return {
    subscriptionInfo,
    isLoading: settings === undefined,
    settings
  };
}
