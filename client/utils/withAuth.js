import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import getReqCookies from './getReqCookies'

const Redirect = ({ path }) => {
  const router = useRouter()
  useEffect(() => {
    router.push(path)
  }, [])
  return <></>
}

export const withAuth = (Component, noRedirect = false) => {
  const Auth = (props) => {
    const [cookies] = useCookies()

    if (!cookies.token && !noRedirect) {
      return <Redirect path="/login" />
    }

    return (
      <Component token={cookies.token} userId={cookies.userId} {...props} />
    )
  }

  return Auth
}

export const withAuthServerSideProps = (
  getServerSideProps,
  noRedirect = false
) => {
  return async (ctx) => {
    const { token, userId } = getReqCookies(ctx.req)

    if (!token && !noRedirect)
      return {
        redirect: {
          permanent: false,
          destination: '/login',
        },
      }

    if (!token && noRedirect) return { props: {} }

    try {
      const { props: ssProps } = await getServerSideProps({
        ...ctx,
        token,
        userId,
      })
      return { props: { ...ssProps, token } }
    } catch (e) {
      if (e === 'banned')
        return {
          redirect: {
            permanent: false,
            destination: '/logout',
          },
        }
      return { props: {} }
    }
  }
}
