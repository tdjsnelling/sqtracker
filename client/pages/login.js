import React, { useContext, useState } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import Link from "next/link";
import { useCookies } from "react-cookie";
import SEO from "../components/SEO";
import Text from "../components/Text";
import Input from "../components/Input";
import Button from "../components/Button";
import { NotificationContext } from "../components/Notifications";
import LoadingContext from "../utils/LoadingContext";
import LocaleContext from "../utils/LocaleContext";
import { usernamePattern } from "./register";

const Login = () => {
  const [totpRequired, setTotpRequired] = useState(false);

  const [, setCookie] = useCookies();

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);
  const { getLocaleString } = useContext(LocaleContext);

  const router = useRouter();

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const res = await fetch(`${SQ_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          totp: form.get("totp"),
        }),
      });

      if (res.status !== 200) {
        const reason = await res.text();
        if (reason === "One-time code required") setTotpRequired(true);
        throw new Error(reason);
      }

      const { token, uid, username } = await res.json();

      const expires = new Date();
      expires.setTime(expires.getTime() + 60 * 60 * 24 * 14 * 1000); // 14 days
      setCookie("token", token, { path: "/", expires });
      setCookie("userId", uid, { path: "/", expires });
      setCookie("username", username, { path: "/", expires });

      addNotification(
        "success",
        `${getLocaleString("welcomeBack")} ${form.get("username")}!`
      );

      router.push("/");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("logInFailed")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={getLocaleString("logIn")} />
      <Text as="h1" mb={5}>
        {getLocaleString("logIn")}
      </Text>
      <form onSubmit={handleLogin}>
        <Input
          name="username"
          label={getLocaleString("username")}
          pattern={usernamePattern}
          mb={4}
          required
        />
        <Input
          name="password"
          type="password"
          label={getLocaleString("password")}
          mb={4}
          required
        />
        {totpRequired && (
          <Input name="totp" label={getLocaleString("totp")} mb={4} required />
        )}
        <Button>{getLocaleString("logIn")}</Button>
      </form>
      <Link href="/reset-password/initiate" passHref>
        <Text as="a" display="inline-block" mt={5}>
          {getLocaleString("resetPassword")}
        </Text>
      </Link>
    </>
  );
};

export default Login;
