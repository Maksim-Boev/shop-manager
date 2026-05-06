import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LoginView } from '@/view/login'

const LoginPage = async () => {
  const session = await auth()
  if (session) redirect('/')
  return <LoginView />
}

export default LoginPage
