import React, { useContext } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import SEO from "../../../components/SEO";
import Text from "../../../components/Text";
import Input from "../../../components/Input";
import Checkbox from "../../../components/Checkbox";
import Button from "../../../components/Button";
import { withAuthServerSideProps } from "../../../utils/withAuth";
import { NotificationContext } from "../../../components/Notifications";
import LoadingContext from "../../../utils/LoadingContext";
import MarkdownInput from "../../../components/MarkdownInput";
import LocaleContext from "../../../utils/LocaleContext";

const EditAnnouncement = ({ announcement, token, userRole }) => {
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
      const updateAnnouncementRes = await fetch(
        `${SQ_API_URL}/announcements/edit/${announcement._id}`,
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

      if (updateAnnouncementRes.status !== 200) {
        const reason = await updateAnnouncementRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("annAnnounceUpdatedSuccess")}`
      );

      const slug = await updateAnnouncementRes.text();
      router.push(`/announcements/${slug}`);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("annCouldNotUpdateAnnounce")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={getLocaleString("annEditAnnounce")} />
      <Text as="h1" mb={5}>
        {getLocaleString("annEditAnnounce")}
      </Text>
      <form onSubmit={handleCreate}>
        <Input
          name="title"
          label={getLocaleString("reqTitle")}
          defaultValue={announcement.title}
          mb={4}
          required
        />
        <MarkdownInput
          name="body"
          label={getLocaleString("annBody")}
          placeholder={getLocaleString("uploadMarkdownSupport")}
          defaultValue={announcement.body}
          rows={10}
          mb={4}
          required
        />
        <Checkbox
          label={getLocaleString("annPinThisAnnounceQ")}
          name="pinned"
          inputProps={{ defaultChecked: announcement.pinned }}
          mb={4}
        />
        <Checkbox
          label={getLocaleString("annAllowCommentsQ")}
          name="allowComments"
          inputProps={{ defaultChecked: announcement.allowComments }}
          mb={4}
        />
        <Button display="block" ml="auto">
          {getLocaleString("annUpdateAnnounce")}
        </Button>
      </form>
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, query: { slug } }) => {
    if (!token) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { role } = jwt.verify(token, SQ_JWT_SECRET);

    try {
      const announcementRes = await fetch(
        `${SQ_API_URL}/announcements/${slug}`,
        {
          headers: fetchHeaders,
        }
      );
      if (
        announcementRes.status === 403 &&
        (await announcementRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const announcement = await announcementRes.json();
      return { props: { announcement, token, userRole: role } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default EditAnnouncement;
