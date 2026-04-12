import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

// ── Configuration ─────────────────────────────────────
// Replace with your real RevenueCat API keys.

const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_YOUR_REVENUECAT_IOS_KEY',
  android: 'goog_YOUR_REVENUECAT_ANDROID_KEY',
}) ?? '';

const PRO_ENTITLEMENT = 'pro';

// ── Initialize ────────────────────────────────────────

let initialized = false;

export async function initializePurchases(): Promise<void> {
  if (initialized) return;
  if (Constants.appOwnership === 'expo') {
    console.warn('[purchaseSdk] Skipping RevenueCat init — running in Expo Go');
    return;
  }
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    initialized = true;
  } catch (e) {
    console.warn('[purchaseSdk] Initialization failed:', e);
  }
}

// ── Offerings ─────────────────────────────────────────

export interface NeurraOffering {
  identifier: string;
  packages: PurchasesPackage[];
}

export async function getOfferings(): Promise<NeurraOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;
    return {
      identifier: current.identifier,
      packages: current.availablePackages,
    };
  } catch (e) {
    console.warn('[purchaseSdk] Failed to fetch offerings:', e);
    return null;
  }
}

// ── Purchase ──────────────────────────────────────────

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (e.userCancelled) return null;
    throw e;
  }
}

// ── Restore ───────────────────────────────────────────

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

// ── Subscription Status ───────────────────────────────

export function isProFromCustomerInfo(info: CustomerInfo): boolean {
  return PRO_ENTITLEMENT in (info.entitlements.active ?? {});
}

export function getProDetails(info: CustomerInfo) {
  const entitlement = info.entitlements.active[PRO_ENTITLEMENT];
  if (!entitlement) return null;

  return {
    productIdentifier: entitlement.productIdentifier,
    expirationDate: entitlement.expirationDate,
    willRenew: entitlement.willRenew,
    isActive: entitlement.isActive,
  };
}

// ── Listener ──────────────────────────────────────────

export function addCustomerInfoListener(
  callback: (info: CustomerInfo) => void,
): () => void {
  // RevenueCat v8: addCustomerInfoUpdateListener returns void,
  // but the callback stays registered for the app lifetime.
  Purchases.addCustomerInfoUpdateListener(callback);
  // Return a no-op since the SDK doesn't support removing individual listeners.
  return () => {};
}

// ── Manage Subscriptions ──────────────────────────────

export async function openManageSubscriptions(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      const { Linking } = await import('react-native');
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      const { Linking } = await import('react-native');
      Linking.openURL(
        'https://play.google.com/store/account/subscriptions',
      );
    }
  } catch {}
}
