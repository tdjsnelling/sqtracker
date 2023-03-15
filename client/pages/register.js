import React, { useContext } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import jwt from "jsonwebtoken";
import { ThemeContext } from "styled-components";
import { transparentize } from "polished";
import SEO from "../components/SEO";
import Text from "../components/Text";
import Input from "../components/Input";
import Button from "../components/Button";
import Box from "../components/Box";
import { NotificationContext } from "../components/Notifications";
import LoadingContext from "../utils/LoadingContext";
import LocaleContext from "../utils/LocaleContext";

export const usernamePattern = "[A-Za-z0-9.]+";

const Register = ({ token: inviteToken, tokenError }) => {
  const [, setCookie] = useCookies();

  const { colors } = useContext(ThemeContext);
  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);
  const { getLocaleString } = useContext(LocaleContext);

  const router = useRouter();

  const {
    publicRuntimeConfig: { SQ_API_URL, SQ_ALLOW_REGISTER },
  } = getConfig();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const res = await fetch(`${SQ_API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.get("email"),
          username: form.get("username"),
          password: form.get("password"),
          invite: inviteToken,
        }),
      });

      if (res.status !== 200) {
        const reason = await res.text();
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
        `${getLocaleString("welcome")} ${form.get("username")}!`
      );

      router.push("/");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("registerFailed")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  if (SQ_ALLOW_REGISTER !== "open" && SQ_ALLOW_REGISTER !== "invite") {
    return (
      <>
        <SEO title={getLocaleString("register")} />
        <Text as="h1" mb={5}>
          {getLocaleString("register")}
        </Text>
        <p>{getLocaleString("registrationClosed")}.</p>
      </>
    );
  }

  return (
    <>
      <SEO title={getLocaleString("register")} />
      <Text as="h1" mb={5}>
        {getLocaleString("register")}
      </Text>
      {!tokenError ? (
        <form onSubmit={handleRegister}>
          <Input
            name="email"
            type="email"
            label={getLocaleString("email")}
            mb={4}
            required
          />
          <Input
            name="username"
            label={getLocaleString("username")}
            placeholder={getLocaleString("usernameRules")}
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
          <Button>{getLocaleString("register")}</Button>
        </form>
      ) : (
        <Box
          bg={transparentize(0.8, colors.error)}
          border="1px solid"
          borderColor="error"
          borderRadius={1}
          p={4}
        >
          <Text>
            {getLocaleString("registerFailed")}: {tokenError}
          </Text>
        </Box>
      )}
    </>
  );
};

export const getServerSideProps = async ({ query: { token } }) => {
  const {
    serverRuntimeConfig: { SQ_JWT_SECRET, SQ_ALLOW_REGISTER },
  } = getConfig();
  if (SQ_ALLOW_REGISTER === "open") return { props: {} };
  if (!token && SQ_ALLOW_REGISTER === "invite")
    return { props: { tokenError: "Invite token not provided" } };
  try {
    const decoded = await jwt.verify(token, SQ_JWT_SECRET);
    if (decoded.validUntil < Date.now())
      return { props: { tokenError: "Invite has expired" } };
    return { props: { token } };
  } catch (e) {
    return { props: { tokenError: e.message } };
  }
};

export default Register;
