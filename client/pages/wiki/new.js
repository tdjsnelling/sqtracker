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

const NewWiki = ({ token, userRole }) => {
  if (userRole !== "admin") {
    return <Text>You do not have permission to do that.</Text>;
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
      const createWikiRes = await fetch(`${SQ_API_URL}/wiki/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: form.get("slug"),
          title: form.get("title"),
          body: form.get("body"),
        }),
      });

      if (createWikiRes.status !== 200) {
        const reason = await createWikiRes.text();
        throw new Error(reason);
      }

      addNotification("success", "Wiki page created successfully");

      const slug = await createWikiRes.text();
      router.push(`/wiki/${slug}`);
    } catch (e) {
      addNotification("error", `Could not create wiki page: ${e.message}`);
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title="New wiki page" />
      <Text as="h1" mb={5}>
        New wiki page
      </Text>
      <form onSubmit={handleCreate}>
        <Input name="slug" label="Path" mb={4} required />
        <Input name="title" label="Title" mb={4} required />
        <Input
          name="body"
          label="Body"
          placeholder="Markdown supported"
          rows={20}
          mb={4}
          required
        />
        <Button display="block" ml="auto">
          Create wiki page
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

export default NewWiki;
