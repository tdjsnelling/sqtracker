import React, { useContext } from "react";
import getConfig from "next/config";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import LocaleContext from "../../utils/LocaleContext";

const InitiatePasswordReset = () => {
  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);
  const { getLocaleString } = useContext(LocaleContext);

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const res = await fetch(`${SQ_API_URL}/reset-password/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.get("email"),
        }),
      });

      if (res.status !== 200) {
        const reason = await res.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        getLocaleString("passwordResetRequestSuccess")
      );
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("passwordResetRequestFailed")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={getLocaleString("resetPassword")} />
      <Text as="h1" mb={5}>
        {getLocaleString("resetPassword")}
      </Text>
      <form onSubmit={handleInitiate}>
        <Input
          name="email"
          type="email"
          label={getLocaleString("email")}
          mb={4}
          required
        />
        <Button>{getLocaleString("resetPassword")}</Button>
      </form>
    </>
  );
};

export default InitiatePasswordReset;
