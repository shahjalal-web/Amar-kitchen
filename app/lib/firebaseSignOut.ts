// লগআউট — Firebase SDK শুধু এই সময় লোড হয় (প্রতিটি পেজের বান্ডেলে না রাখতে)।
// এই ফাইলে firebase-এর কোনো স্ট্যাটিক import রাখবেন না।
export const firebaseSignOut = async () => {
  const [{ signOut }, { auth }] = await Promise.all([import('firebase/auth'), import('./firebase')]);
  await signOut(auth).catch(() => undefined);
};
