import React, { useState, useContext, useRef } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import jwt from "jsonwebtoken";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCookies } from "react-cookie";
import { Pin } from "@styled-icons/boxicons-regular";
import SEO from "../../../components/SEO";
import Box from "../../../components/Box";
import Text from "../../../components/Text";
import Button from "../../../components/Button";
import MarkdownBody from "../../../components/MarkdownBody";
import { withAuthServerSideProps } from "../../../utils/withAuth";
import { NotificationContext } from "../../../components/Notifications";
import Input from "../../../components/Input";
import Comment from "../../../components/Comment";
import LoadingContext from "../../../utils/LoadingContext";
import Modal from "../../../components/Modal";
import LocaleContext from "../../../utils/LocaleContext";

const Announcement = ({ announcement, token, userRole }) => {
  const [pinned, setPinned] = useState(announcement.pinned);
  const [comments, setComments] = useState(announcement.comments);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const commentInputRef = useRef();

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const router = useRouter();

  const [cookies] = useCookies();

  const { getLocaleString } = useContext(LocaleContext);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const deleteRes = await fetch(
        `${SQ_API_URL}/announcements/${announcement.slug}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (deleteRes.status !== 200) {
        const reason = await deleteRes.text();
        throw new Error(reason);
      }

      addNotification("success"`${getLocaleString("annAnnounceDelSuccess")}`);

      router.push("/announcements");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("annCouldNotDelAnnounce")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handlePin = async () => {
    setLoading(true);

    try {
      const pinRes = await fetch(
        `${SQ_API_URL}/announcements/pin/${announcement._id}/${
          pinned ? "unpin" : "pin"
        }`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (pinRes.status !== 200) {
        const reason = await pinRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("annAnnounce")} ${
          pinned ? getLocaleString("annUnpinned") : getLocaleString("annPinned")
        } ${getLocaleString("userSuccessfully")}`
      );

      setPinned((p) => !p);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("userCouldNot")} ${
          pinned ? getLocaleString("annUnpin") : getLocaleString("annPin")
        } announcement: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const commentRes = await fetch(
        `${SQ_API_URL}/announcements/comment/${announcement._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: form.get("comment"),
          }),
        }
      );

      if (commentRes.status !== 200) {
        const reason = await commentRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("reqCommentPostSuccess")}`);

      setComments((c) => {
        const newComment = {
          comment: form.get("comment"),
          created: Date.now(),
          user: {
            username: cookies.username,
          },
        };
        return [newComment, ...c];
      });

      commentInputRef.current.value = "";
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("reqCommentNotPost")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO
        title={`${announcement.title} | ${getLocaleString("navAnnouncements")}`}
      />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <Text as="h1">{announcement.title}</Text>
          {pinned && (
            <Box color="grey" ml={3}>
              <Pin size={24} />
            </Box>
          )}
        </Box>
        {userRole === "admin" && (
          <Box display="flex" alignItems="center">
            <Button onClick={handlePin} variant="secondary" mr={3}>
              {pinned
                ? `${getLocaleString("annUnpin")}`
                : `${getLocaleString("annPin")}`}
            </Button>
            <Link href={`${router.asPath}/edit`} passHref>
              <a>
                <Button variant="secondary" mr={3}>
                  {getLocaleString("torrEdit")}
                </Button>
              </a>
            </Link>
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="secondary"
            >
              {getLocaleString("reqDelete")}
            </Button>
          </Box>
        )}
      </Box>
      <Box mb={5}>
        <Text color="grey">
          {getLocaleString("reqPosted")}{" "}
          {moment(announcement.created).format(
            `${getLocaleString("indexTime")}`
          )}{" "}
          {getLocaleString("reqBy")}{" "}
          {announcement.createdBy?.username ? (
            <Link href={`/user/${announcement.createdBy.username}`} passHref>
              <a>{announcement.createdBy.username}</a>
            </Link>
          ) : (
            "deleted user"
          )}
        </Text>
        {announcement.updated && (
          <Text color="grey" mt={3}>
            {getLocaleString("annLastUpdated")}{" "}
            {moment(announcement.updated).format(
              `${getLocaleString("indexTime")}`
            )}
          </Text>
        )}
      </Box>
      <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
        <MarkdownBody>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {announcement.body}
          </ReactMarkdown>
        </MarkdownBody>
      </Box>
      <Box>
        <Text as="h2" mb={4}>
          {getLocaleString("userComments")}
        </Text>
        <form onSubmit={handleComment}>
          <Input
            ref={commentInputRef}
            name="comment"
            label={getLocaleString("reqPostAComment")}
            rows="5"
            placeholder={
              !announcement.allowComments
                ? `${getLocaleString("annCommentsDisabled")}`
                : undefined
            }
            disabled={!announcement.allowComments}
            mb={4}
          />
          <Button
            display="block"
            disabled={!announcement.allowComments}
            ml="auto"
          >
            {getLocaleString("reqPost")}
          </Button>
        </form>
        {!!comments?.length && (
          <Box mt={5}>
            {comments.map((comment) => (
              <Comment
                key={comment._id || comment.created}
                comment={{ ...comment, announcement }}
              />
            ))}
          </Box>
        )}
      </Box>
      {showDeleteModal && (
        <Modal close={() => setShowDeleteModal(false)}>
          <Text mb={5}>
            {getLocaleString("annAreYouSureYouWantToDelThisannounceQ")}
          </Text>
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

export default Announcement;
