import React, { useContext } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import Input from "../../components/Input";
import Checkbox from "../../components/Checkbox";
import Button from "../../components/Button";
import { withAuthServerSideProps } from "../../utils/withAuth";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import MarkdownInput from "../../components/MarkdownInput";
import LocaleContext from "../../utils/LocaleContext";

const NewAnnouncement = ({ token, userRole }) => {
  const { getLocaleString } = useContext(LocaleContext);

  if (userRole !== "admin") {
    return <Text>{getLocaleString("statYouNotPermission")}</Text>;
  }

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const router = useRouter();

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const createAnnouncementRes = await fetch(
        `${SQ_API_URL}/announcements/new`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.get("title"),
            body: form.get("body"),
            pinned: !!form.get("pinned"),
            allowComments: !!form.get("allowComments"),
          }),
        }
      );

      if (createAnnouncementRes.status !== 200) {
        const reason = await createAnnouncementRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("annAnnounceCreatSuccess")}`
      );

      const slug = await createAnnouncementRes.text();
      router.push(`/announcements/${slug}`);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("annCouldNotCreateAnnounce")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={getLocaleString("annNewAnnounce")} />
      <Text as="h1" mb={5}>
        {getLocaleString("annNewAnnounce")}
      </Text>
      <form onSubmit={handleCreate}>
        <Input
          name="title"
          label={getLocaleString("reqTitle")}
          mb={4}
          required
        />
        <MarkdownInput
          name="body"
          label={getLocaleString("annBody")}
          placeholder={getLocaleString("uploadMarkdownSupport")}
          rows={10}
          mb={4}
          required
        />
        <Checkbox
          label={getLocaleString("annPinThisAnnounceQ")}
          name="pinned"
          mb={4}
        />
        <Checkbox
          label={getLocaleString("annAllowCommentsQ")}
          name="allowComments"
          mb={4}
        />
        <Button display="block" ml="auto">
          {getLocaleString("annCreateAnnounce")}
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

export default NewAnnouncement;
