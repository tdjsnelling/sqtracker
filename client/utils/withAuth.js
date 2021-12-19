import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'

const Redirect = ({ path }) => {
  const router = useRouter()
  useEffect(() => {
    router.push(path)
  }, [])
  return <></>
}

const withAuth = (Component) => {
  const Auth = (props) => {
    const [cookies] = useCookies()

    if (!cookies.token) {
      return <Redirect path="/login" />
    }

    return <Component token={cookies.token} {...props} />
  }

  if (Component.getInitialProps) {
    Auth.getInitialProps = Component.getInitialProps
  }

  return Auth
}

export default withAuth
