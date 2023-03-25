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

      addNotification("success", "Wiki page deleted successfully");

      setShowDeleteModal(false);

      await router.push("/wiki");
    } catch (e) {
      addNotification("error", `Could not delete wiki page: ${e.message}`);
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
          }),
        }
      );

      if (updateWikiRes.status !== 200) {
        const reason = await updateWikiRes.text();
        throw new Error(reason);
      }

      addNotification("success", "Wiki page updated successfully");

      if (form.get("slug") === page.slug) window.location.reload();
      else
        window.location.href =
          "/wiki" + (page.slug === "/" ? "" : form.get("slug"));
    } catch (e) {
      addNotification("error", `Could not update wiki page: ${e.message}`);
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
                Add page
              </Button>
            </Link>
            {!!page && (
              <>
                <Button
                  onClick={() => setEditing(true)}
                  variant="secondary"
                  ml={3}
                >
                  Edit
                </Button>
                {!!slug && (
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="secondary"
                    ml={3}
                  >
                    Delete
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
              Last edited{" "}
              {moment(page.updated ?? page.created).format("HH:mm Do MMM YYYY")}{" "}
              by{" "}
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
              gridTemplateColumns={["1fr", "200px auto"]}
              gridGap={5}
            >
              <Box
                bg="sidebar"
                border="1px solid"
                borderColor="border"
                borderRadius={1}
                p={3}
              >
                <Text
                  fontWeight={600}
                  fontSize={1}
                  mb={3}
                  _css={{ textTransform: "uppercase" }}
                >
                  Pages
                </Text>
                {allPages.sort(sortSlug).map((p) => (
                  <Link
                    key={`page-${p.slug}`}
                    href={`/wiki/${p.slug}`}
                    passHref
                  >
                    <Text as="a" display="block">
                      {p.title}
                    </Text>
                  </Link>
                ))}
              </Box>
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
                  Cancel
                </Button>
                <Button>Save changes</Button>
              </Box>
            </form>
          )}
        </>
      ) : (
        <Text color="grey">There is nothing here yet.</Text>
      )}
      {showDeleteModal && (
        <Modal close={() => setShowDeleteModal(false)}>
          <Text mb={5}>
            Are you sure you want to delete this wiki page? This cannot be
            undone.
          </Text>
          <Box display="flex" justifyContent="flex-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
              mr={3}
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="danger">
              Delete
            </Button>
          </Box>
        </Modal>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, query: { slug } }) => {
    if (!token) return { props: {} };

    const parsedSlug = slug?.length ? slug.join("/") : "";

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { role } = jwt.verify(token, SQ_JWT_SECRET);

    try {
      const wikiRes = await fetch(`${SQ_API_URL}/wiki/${parsedSlug}`, {
        headers: fetchHeaders,
      });
      if (
        wikiRes.status === 403 &&
        (await wikiRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const { page, allPages } = await wikiRes.json();
      return {
        props: { page, allPages, token, userRole: role, slug: parsedSlug },
      };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: { token, userRole: role, slug: parsedSlug } };
    }
  }
);

export default Wiki;
