const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'এই ইমেইল দিয়ে আগেই একাউন্ট আছে',
  'auth/invalid-email': 'ইমেইল ঠিকানাটি সঠিক নয়',
  'auth/weak-password': 'পাসওয়ার্ড দুর্বল, ন্যূনতম ৬ অক্ষর দিন',
  'auth/wrong-password': 'পাসওয়ার্ড সঠিক নয়',
  'auth/user-not-found': 'এই ইমেইলে কোনো একাউন্ট নেই',
  'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড সঠিক নয়',
  'auth/too-many-requests': 'অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন',
  'auth/network-request-failed': 'নেটওয়ার্ক সমস্যা, ইন্টারনেট সংযোগ পরীক্ষা করুন',
  'auth/operation-not-allowed': 'এই লগইন পদ্ধতি এখনো চালু করা হয়নি (Firebase Console-এ Email/Password provider enable করুন)',
};

export function getErrorMessage(err: unknown, fallback: string): string {
  const firebaseCode = (err as { code?: string })?.code;
  if (firebaseCode?.startsWith('auth/')) {
    return FIREBASE_AUTH_MESSAGES[firebaseCode] || `${fallback} (${firebaseCode})`;
  }

  const backendMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (backendMessage) return backendMessage;

  return fallback;
}
