import React, { useContext, useState } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import slugify from "slugify";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import Input from "../../components/Input";
import Button from "../../components/Button";
import MarkdownInput from "../../components/MarkdownInput";
import { withAuthServerSideProps } from "../../utils/withAuth";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import Checkbox from "../../components/Checkbox";
import LocaleContext from "../../utils/LocaleContext";

export const WikiFields = ({ values }) => {
  const [slugValue, setSlugValue] = useState(values?.slug);

  const {
    publicRuntimeConfig: { SQ_BASE_URL, SQ_ALLOW_UNREGISTERED_VIEW },
  } = getConfig();

  const { getLocaleString } = useContext(LocaleContext);

  console.log(values);

  return (
    <>
      <Input
        name="slug"
        label={getLocaleString("wikiPath")}
        value={slugValue}
        onChange={(e) => setSlugValue(e.target.value)}
        onBlur={(e) => {
          let { value } = e.target;
          if (!value.startsWith("/")) value = `/${value}`;
          if (value.endsWith("/") && value !== "/") value = value.slice(0, -1);
          const split = value.split("/");
          const slugified = split.map((token) =>
            slugify(token, { lower: true })
          );
          setSlugValue(slugified.join("/"));
        }}
        disabled={values?.slug === "/"}
        mb={2}
        required
      />
      <Text color="grey" fontSize={0} mb={4}>
        {getLocaleString("wikiPageWillBeVisibleAt")} {SQ_BASE_URL}/wiki
        {slugValue}
      </Text>
      <Input
        name="title"
        label={getLocaleString("reqTitle")}
        defaultValue={values?.title}
        mb={4}
        required
      />
      <MarkdownInput
        name="body"
        label={getLocaleString("annBody")}
        placeholder={getLocaleString("uploadMarkdownSupport")}
        defaultValue={values?.body}
        rows={20}
        mb={4}
        required
      />
      {SQ_ALLOW_UNREGISTERED_VIEW && (
        <Checkbox
          name="public"
          label={getLocaleString("wikiAllowUnregisteredView")}
          inputProps={{ defaultChecked: values?.public }}
          mb={4}
        />
      )}
    </>
  );
};

const NewWiki = ({ token, userRole }) => {
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
          public: !!form.get("public"),
        }),
      });

      if (createWikiRes.status !== 200) {
        const reason = await createWikiRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("wikiPageCreateSuccess")}`);

      const slug = await createWikiRes.text();
      router.push(`/wiki/${slug}`);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("wikiCouldNotCreatePage")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={getLocaleString("wikiNewPage")} />
      <Text as="h1" mb={5}>
        {getLocaleString("wikiNewPage")}
      </Text>
      <form onSubmit={handleCreate}>
        <WikiFields />
        <Button display="block" ml="auto">
          {getLocaleString("wikiCreatePage")}
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
