import { useAuth } from '@/hooks/useAuth'
import MySubscriptionsUI from '@/pages/ui/MySubscriptionsUI'

const MySubscriptions = () => {
  const { user, loading } = useAuth()
  return <MySubscriptionsUI user={user} authLoading={loading} />
}

export default MySubscriptions
