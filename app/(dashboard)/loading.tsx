import Loader from '../components/ui/Loader';

// পেজ বদলানোর সময় সাথে সাথে দেখায় (Next.js-এর Suspense সীমানা)
export default function DashboardLoading() {
  return <Loader />;
}
