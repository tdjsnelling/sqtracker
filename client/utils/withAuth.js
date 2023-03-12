import { useEffect } from "react";
import { useRouter } from "next/router";
import getConfig from "next/config";
import { useCookies } from "react-cookie";
import getReqCookies from "./getReqCookies";

const Redirect = ({ path }) => {
  const router = useRouter();
  useEffect(() => {
    router.push(path);
  }, []);
  return <></>;
};

export const withAuth = (Component, noRedirect = false) => {
  const Auth = (props) => {
    const [cookies] = useCookies();

    if (!cookies.token && !noRedirect) {
      return <Redirect path="/login" />;
    }

    return (
      <Component token={cookies.token} userId={cookies.userId} {...props} />
    );
  };

  return Auth;
};

export const withAuthServerSideProps = (
  getServerSideProps,
  publicAccess = false,
  noRedirect = false
) => {
  return async (ctx) => {
    let { token, userId } = getReqCookies(ctx.req);

    const {
      serverRuntimeConfig: { SQ_SERVER_SECRET },
      publicRuntimeConfig: { SQ_ALLOW_UNREGISTERED_VIEW },
    } = getConfig();

    const isPublicAccess = publicAccess && SQ_ALLOW_UNREGISTERED_VIEW && !token;

    if (!token && !noRedirect && !isPublicAccess)
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };

    if (!token && noRedirect && !isPublicAccess) return { props: {} };

    if (isPublicAccess) {
      token = null;
      userId = null;
    }

    try {
      const fetchHeaders = {
        "Content-Type": "application/json",
        "X-Forwarded-For":
          ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket.remoteAddress,
        "X-Sq-Server-Secret": SQ_SERVER_SECRET,
        "X-Sq-Public-Access": isPublicAccess,
      };

      if (token) {
        fetchHeaders["Authorization"] = `Bearer ${token}`;
      }

      const { props: ssProps, notFound } = await getServerSideProps({
        ...ctx,
        token,
        userId,
        fetchHeaders,
        isPublicAccess,
      });
      return { props: { ...ssProps, token }, notFound };
    } catch (e) {
      if (e === "banned")
        return {
          redirect: {
            permanent: false,
            destination: "/logout",
          },
        };
      return { props: {} };
    }
  };
};
