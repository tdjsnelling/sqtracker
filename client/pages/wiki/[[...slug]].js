import React, { useState, useContext, useEffect } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import moment from "moment";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import Button from "../../components/Button";
import MarkdownBody from "../../components/MarkdownBody";
import { withAuthServerSideProps } from "../../utils/withAuth";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import Modal from "../../components/Modal";
import { WikiFields } from "./new";
import LocaleContext from "../../utils/LocaleContext";

const sortSlug = (a, b) => {
  if (a.slug > b.slug) return 1;
  if (a.slug < b.slug) return -1;
  return 0;
};

const Wiki = ({ page, allPages, token, userRole, slug }) => {
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const router = useRouter();

  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_API_URL },
  } = getConfig();

  useEffect(() => {
    setEditing(false);
  }, [router.asPath]);

  const { getLocaleString } = useContext(LocaleContext);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const deleteRes = await fetch(`${SQ_API_URL}/wiki/${page.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (deleteRes.status !== 200) {
        const reason = await deleteRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("wikiPageDelSuccess")}`);

      setShowDeleteModal(false);

      await router.push("/wiki");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("wikiCouldNotDelPage")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const updateWikiRes = await fetch(
        `${SQ_API_URL}/wiki/update/${page._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slug: page.slug === "/" ? "/" : form.get("slug"),
            title: form.get("title"),
            body: form.get("body"),
            public: !!form.get("public"),
          }),
        }
      );

      if (updateWikiRes.status !== 200) {
        const reason = await updateWikiRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("wikiPageUpdateSuccess")}`);

      if (form.get("slug") === page.slug) window.location.reload();
      else
        window.location.href =
          "/wiki" + (page.slug === "/" ? "" : form.get("slug"));
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("wikiCouldNotUpdatePage")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={page?.title ? `${page.title} | Wiki` : "Wiki"} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Text as="h1">{page?.title ?? `${SQ_SITE_NAME} wiki`}</Text>
        {userRole === "admin" && !editing && (
          <Box display="flex" alignItems="center">
            <Link href="/wiki/new" passHref>
              <Button as="a" variant="secondary">
                {getLocaleString("wikiAddPage")}
              </Button>
            </Link>
            {!!page && (
              <>
                <Button
                  onClick={() => setEditing(true)}
                  variant="secondary"
                  ml={3}
                >
                  {getLocaleString("torrEdit")}
                </Button>
                {!!slug && (
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="secondary"
                    ml={3}
                  >
                    {getLocaleString("reqDelete")}
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
      {page ? (
        <>
          <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
            <Text color="grey">
              {getLocaleString("wikiLastEdited")}{" "}
              {moment(page.updated ?? page.created).format(
                `${getLocaleString("indexTime")}`
              )}{" "}
              {getLocaleString("reqBy")}{" "}
              {page.createdBy?.username ? (
                <Link href={`/user/${page.createdBy.username}`} passHref>
                  <a>{page.createdBy.username}</a>
                </Link>
              ) : (
                "deleted user"
              )}
            </Text>
          </Box>
          {!editing ? (
            <Box
              display="grid"
              gridTemplateColumns={["1fr", "auto 200px"]}
              gridGap={5}
              alignItems="start"
            >
              <MarkdownBody>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a({ href, ...props }) {
                      return href.startsWith("http") ? (
                        <a href={href} target="_blank" {...props} />
                      ) : (
                        <Link href={href} passHref>
                          <a {...props} />
                        </Link>
                      );
                    },
                  }}
                >
                  {page.body}
                </ReactMarkdown>
              </MarkdownBody>
              <Box
                bg="sidebar"
                border="1px solid"
                borderColor="border"
                borderRadius={1}
                p={4}
                _css={{ order: [-1, "unset"] }}
              >
                <Text
                  fontWeight={600}
                  fontSize={1}
                  mb={3}
                  _css={{ textTransform: "uppercase" }}
                >
                  {getLocaleString("wikiPages")}
                </Text>
                {allPages.sort(sortSlug).map((p) => (
                  <Link key={`page-${p.slug}`} href={`/wiki${p.slug}`} passHref>
                    <Text as="a" display="block">
                      {p.title}
                    </Text>
                  </Link>
                ))}
              </Box>
            </Box>
          ) : (
            <form onSubmit={handleEdit}>
              <WikiFields values={page} />
              <Box display="flex" justifyContent="flex-end">
                <Button
                  onClick={() => setEditing(false)}
                  type="button"
                  variant="secondary"
                  mr={3}
                >
                  {getLocaleString("accCancel")}
                </Button>
                <Button>{getLocaleString("wikiSaveChanges")}</Button>
              </Box>
            </form>
          )}
        </>
      ) : allPages.length > 0 ? (
          <>
            {allPages.map((p) => (
                <Link key={`page-${p.slug}`} href={`/wiki${p.slug}`} passHref>
                  <Text as="a" display="block">
                    {p.title}
                  </Text>
                </Link>
            ))}
          </>
      ) : (
        <Text>{getLocaleString("wikiThereNothingHereYet")}</Text>
      )}
      {showDeleteModal && (
        <Modal close={() => setShowDeleteModal(false)}>
          <Text mb={5}>{getLocaleString("wikiDelThisPageQ")}</Text>
          <Box display="flex" justifyContent="flex-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
              mr={3}
            >
              {getLocaleString("accCancel")}
            </Button>
            <Button onClick={handleDelete} variant="danger">
              {getLocaleString("reqDelete")}
            </Button>
          </Box>
        </Modal>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, isPublicAccess, query: { slug } }) => {
    if (!token && !isPublicAccess) return { props: {} };
    const parsedSlug = slug?.length ? slug.join("/") : "";

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { role } = token ? jwt.verify(token, SQ_JWT_SECRET) : { role: null };
    try {
        let page, allPages;
        if (parsedSlug.length === 0) {
          const wikiRes = await fetch(`${SQ_API_URL}/wiki`, {
            headers: fetchHeaders,
          });
          ({ allPages } = await wikiRes.json());

          return {
            props: {allPages, token, userRole: role, slug: parsedSlug, },
          };
      } else {
        const wikiRes = await fetch(`${SQ_API_URL}/wiki/${parsedSlug}`, {
          headers: fetchHeaders,
        });
        if (wikiRes.status === 403 && (await wikiRes.text()) === "User is banned") {
          throw "banned";
        }
        ({ page, allPages } = await wikiRes.json());
        return {
          props: { page, allPages, token, userRole: role, slug: parsedSlug },
        };
    }
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: { token, userRole: role, slug: parsedSlug } };
    }
  },
  true
);

export default Wiki;
