import React, { useState, useEffect, useContext } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import Link from "next/link";
import { ThemeContext } from "styled-components";
import { transparentize } from "polished";
import SEO from "../components/SEO";
import Text from "../components/Text";
import Box from "../components/Box";
import LocaleContext from "../utils/LocaleContext";

const VerifyEmail = () => {
  const [tokenError, setTokenError] = useState();

  const { colors } = useContext(ThemeContext);

  const router = useRouter();
  const { token } = router.query;

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const { getLocaleString } = useContext(LocaleContext);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const res = await fetch(`${SQ_API_URL}/verify-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          });

          if (res.status !== 200) {
            const reason = await res.text();
            throw new Error(reason);
          }

          setTokenError(undefined);
        } catch (e) {
          setTokenError(e.message);
        }
      } else {
        setTokenError(`${getLocaleString("veNoVerificationTokenProvided")}`);
      }
    };
    verify();
  }, [token]);

  return (
    <>
      <SEO title={getLocaleString("veVerifyEmail")} />
      <Text as="h1" mb={5}>
        {getLocaleString("veVerifyEmail")}
      </Text>
      {!tokenError ? (
        <>
          <Text>
            {getLocaleString("veEmailAddressVerifiedSuccess")}{" "}
            <Link href="/login" passHref>
              <a>{getLocaleString("logIn")}</a>
            </Link>
          </Text>
        </>
      ) : (
        <Box
          bg={transparentize(0.8, colors.error)}
          border="1px solid"
          borderColor="error"
          borderRadius={1}
          p={4}
        >
          <Text>
            {getLocaleString("veCouldNotVerifyEmailAddress")} {tokenError}
          </Text>
        </Box>
      )}
    </>
  );
};

export default VerifyEmail;
