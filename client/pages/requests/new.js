import React, { useContext } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { withAuthServerSideProps } from "../../utils/withAuth";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import MarkdownInput from "../../components/MarkdownInput";
import LocaleContext from "../../utils/LocaleContext";

const NewRequest = ({ token }) => {
  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const router = useRouter();

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const { getLocaleString } = useContext(LocaleContext);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const createRequestRes = await fetch(`${SQ_API_URL}/requests/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.get("title"),
          body: form.get("body"),
        }),
      });

      if (createRequestRes.status !== 200) {
        const reason = await createRequestRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("reqRequestCreatedSuccess")}`
      );

      const { index } = await createRequestRes.json();
      router.push(`/requests/${index}`);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("reqCouldNotCreateReq")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={getLocaleString("reqNewRequest")} />
      <Text as="h1" mb={5}>
        {getLocaleString("reqNewRequest")}
      </Text>
      <form onSubmit={handleCreate}>
        <Input
          name="title"
          label={getLocaleString("reqTitle")}
          placeholder={getLocaleString("reqWhatYouLookForQ")}
          mb={4}
          required
        />
        <MarkdownInput
          name="body"
          label={getLocaleString("uploadDescription")}
          placeholder={getLocaleString("uploadMarkdownSupport")}
          rows={10}
          mb={4}
          required
        />
        <Button display="block" ml="auto">
          {getLocaleString("reqCreateReq")}
        </Button>
      </form>
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(async ({ token }) => {
  if (!token) return { props: {} };

  const {
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig();

  const { role } = jwt.verify(token, SQ_JWT_SECRET);

  return { props: { token, userRole: role } };
});

export default NewRequest;
