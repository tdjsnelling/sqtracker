import React, { useState, useContext, useRef } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import jwt from "jsonwebtoken";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCookies } from "react-cookie";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import Button from "../../components/Button";
import MarkdownBody from "../../components/MarkdownBody";
import { withAuthServerSideProps } from "../../utils/withAuth";
import { NotificationContext } from "../../components/Notifications";
import Input from "../../components/Input";
import Comment from "../../components/Comment";
import Modal from "../../components/Modal";
import List from "../../components/List";
import { ListUl } from "@styled-icons/boxicons-regular/ListUl";
import slugify from "slugify";
import { Check } from "@styled-icons/boxicons-regular/Check";
import { X } from "@styled-icons/boxicons-regular/X";
import LoadingContext from "../../utils/LoadingContext";
import LocaleContext from "../../utils/LocaleContext";

const Request = ({ request, token, user }) => {
  const [comments, setComments] = useState(request.comments);
  const [candidates, setCandidates] = useState(request.candidates.reverse());
  const [fulfilledBy, setFulfilledBy] = useState(request.fulfilledBy);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);
  const { getLocaleString } = useContext(LocaleContext);

  const commentInputRef = useRef();

  const {
    publicRuntimeConfig: {
      SQ_API_URL,
      SQ_SITE_WIDE_FREELEECH,
      SQ_TORRENT_CATEGORIES,
    },
  } = getConfig();

  const router = useRouter();

  const [cookies] = useCookies();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const deleteRes = await fetch(`${SQ_API_URL}/requests/${request.index}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (deleteRes.status !== 200) {
        const reason = await deleteRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("reqRequestDelSuccess")}`);

      router.push("/requests");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("reqCouldNotDelReq")}: ${e.message}`
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
        `${SQ_API_URL}/requests/comment/${request._id}`,
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

  const handleSuggestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const suggestRes = await fetch(
        `${SQ_API_URL}/requests/suggest/${request._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            infoHash: form.get("infoHash"),
          }),
        }
      );

      if (suggestRes.status !== 200) {
        const reason = await suggestRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("reqSuggestionAddSuccess")}`
      );

      const { torrent } = await suggestRes.json();
      setCandidates((existing) => [torrent, ...existing]);

      setShowSuggestModal(false);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("reqSuggestionNotAdded")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleAccept = async (infoHash) => {
    setLoading(true);

    try {
      const acceptRes = await fetch(
        `${SQ_API_URL}/requests/accept/${request._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            infoHash,
          }),
        }
      );

      if (acceptRes.status !== 200) {
        const reason = await acceptRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("reqSuggestionAcceptSuccess")}`
      );

      const { torrent } = await acceptRes.json();
      setFulfilledBy(torrent);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("reqCouldNotAcceptSuggestion")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title={`${request.title} | Request`} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <Text as="h1">{request.title}</Text>
        </Box>
        {user === request.createdBy?._id && (
          <Button onClick={handleDelete} variant="secondary">
            {getLocaleString("reqDelete")}
          </Button>
        )}
      </Box>
      <Box mb={5}>
        <Text color="grey">
          {getLocaleString("reqPosted")}{" "}
          {moment(request.created).format(`${getLocaleString("indexTime")}`)}{" "}
          {getLocaleString("reqBy")}{" "}
          {request.createdBy?.username ? (
            <Link href={`/user/${request.createdBy.username}`} passHref>
              <a>{request.createdBy.username}</a>
            </Link>
          ) : (
            "deleted user"
          )}
        </Text>
      </Box>
      <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
        <MarkdownBody>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {request.body}
          </ReactMarkdown>
        </MarkdownBody>
      </Box>
      <Box mb={5}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={4}
        >
          <Text as="h2">{getLocaleString("reqSuggestedTorrents")}</Text>
          <Button
            onClick={() => setShowSuggestModal(true)}
            disabled={!!fulfilledBy}
          >
            {getLocaleString("reqSuggestATorrent")}
          </Button>
        </Box>
        {candidates.length ? (
          <List
            data={candidates.map((torrent) => ({
              ...torrent,
              href: `/torrent/${torrent.infoHash}`,
            }))}
            columns={[
              {
                header: `${getLocaleString("uploadName")}`,
                accessor: "name",
                cell: ({ value, row }) => (
                  <Text>
                    {value}
                    {(row.freeleech || SQ_SITE_WIDE_FREELEECH === true) && (
                      <Text as="span" fontSize={0} color="primary" ml={3}>
                        {getLocaleString("torrFL")}
                      </Text>
                    )}
                  </Text>
                ),
                gridWidth: "2fr",
              },
              {
                header: `${getLocaleString("uploadCategory")}`,
                accessor: "type",
                cell: ({ value }) => (
                  <Text icon={ListUl}>
                    {Object.keys(SQ_TORRENT_CATEGORIES).find(
                      (c) => slugify(c, { lower: true }) === value
                    ) || "None"}
                  </Text>
                ),
                gridWidth: "1fr",
              },
              {
                header: `${getLocaleString("reqAccepted")}`,
                accessor: "_id",
                cell: ({ value }) => (
                  <Box color={value === fulfilledBy ? "success" : "grey"}>
                    {value === fulfilledBy ? (
                      <Check size={24} />
                    ) : (
                      <X size={24} />
                    )}
                  </Box>
                ),
                gridWidth: "1fr",
              },
              {
                header: `${getLocaleString("userUploaded")}`,
                accessor: "created",
                cell: ({ value }) => (
                  <Text>
                    {moment(value).format(`${getLocaleString("indexTime")}`)}
                  </Text>
                ),
                gridWidth: "175px",
                rightAlign: true,
              },
              ...(user === request.createdBy._id
                ? [
                    {
                      cell: ({ row }) => (
                        <Button
                          onClick={async (e) => {
                            e.preventDefault();
                            await handleAccept(row.infoHash);
                          }}
                          disabled={!!fulfilledBy}
                          small
                        >
                          {getLocaleString("reqAccept")}
                        </Button>
                      ),
                      gridWidth: "90px",
                      rightAlign: true,
                    },
                  ]
                : []),
            ]}
          />
        ) : (
          <Text color="grey">
            {getLocaleString("reqNoTorrentsHaveBeenSuggestedYet")}
          </Text>
        )}
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
            mb={4}
          />
          <Button display="block" ml="auto">
            {getLocaleString("reqPost")}
          </Button>
        </form>
        {!!comments?.length && (
          <Box mt={5}>
            {comments.map((comment) => (
              <Comment
                key={comment._id || comment.created}
                comment={{ ...comment, request }}
              />
            ))}
          </Box>
        )}
      </Box>
      {showSuggestModal && (
        <Modal close={() => setShowSuggestModal(false)}>
          <Text mb={5}>{getLocaleString("reqEnterInfohashTorrentBelow")}</Text>
          <form onSubmit={handleSuggestion}>
            <Input
              name="infoHash"
              label={getLocaleString("reqInfohash")}
              mb={4}
            />
            <Box display="flex" justifyContent="flex-end">
              <Button
                type="button"
                onClick={() => setShowSuggestModal(false)}
                variant="secondary"
                mr={3}
              >
                {getLocaleString("accCancel")}
              </Button>
              <Button>{getLocaleString("reqSuggest")}</Button>
            </Box>
          </form>
        </Modal>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, query: { index } }) => {
    if (!token) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { id } = jwt.verify(token, SQ_JWT_SECRET);

    try {
      const requestRes = await fetch(`${SQ_API_URL}/requests/${index}`, {
        headers: fetchHeaders,
      });
      if (
        requestRes.status === 403 &&
        (await requestRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const request = await requestRes.json();
      return { props: { request, token, user: id } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Request;
