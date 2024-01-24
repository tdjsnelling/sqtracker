import React, { useState, useContext, useRef } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import prettyBytes from "pretty-bytes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jwt from "jsonwebtoken";
import { useCookies } from "react-cookie";
import slugify from "slugify";
import { File } from "@styled-icons/boxicons-regular/File";
import { Folder } from "@styled-icons/boxicons-regular/Folder";
import { Like } from "@styled-icons/boxicons-regular/Like";
import { Dislike } from "@styled-icons/boxicons-regular/Dislike";
import { Bookmark as BookmarkEmpty } from "@styled-icons/boxicons-regular/Bookmark";
import { Bookmark } from "@styled-icons/boxicons-solid/Bookmark";
import { withAuthServerSideProps } from "../../utils/withAuth";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import Infobox from "../../components/Infobox";
import MarkdownBody from "../../components/MarkdownBody";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Comment from "../../components/Comment";
import Modal from "../../components/Modal";
import TorrentList from "../../components/TorrentList";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import { TorrentFields } from "../upload";
import MarkdownInput from "../../components/MarkdownInput";
import LocaleContext from "../../utils/LocaleContext";

// from https://stackoverflow.com/a/44681235/7739519
const insert = (children = [], [head, ...tail], size) => {
  let child = children.find((child) => child.name === head);
  if (!child) children.push((child = { name: head, children: [] }));
  if (tail.length > 0) insert(child.children, tail, size);
  else child.size = size;
  return children;
};

export const Info = ({ title, items }) => (
  <Infobox mb={5}>
    {title && (
      <Text
        fontWeight={600}
        fontSize={1}
        _css={{ textTransform: "uppercase" }}
        mb={4}
      >
        {title}
      </Text>
    )}
    <Box display="grid" gridTemplateColumns="1fr" gridGap={[3, 2]}>
      {Object.entries(items).map(([key, val], i) =>
        val !== null && val !== undefined ? (
          <Box
            key={`infobox-row-${i}`}
            display="grid"
            gridTemplateColumns={["1fr", "1fr 2fr"]}
            gridGap={2}
            alignItems="center"
          >
            <Text
              fontWeight={600}
              fontSize={1}
              _css={{ textTransform: "uppercase" }}
            >
              {key}
            </Text>
            <Text>{val}</Text>
          </Box>
        ) : null
      )}
    </Box>
  </Infobox>
);

const WrapExpandable = ({ wrap, children }) =>
  wrap ? <details>{children}</details> : children;

const sortName = (a, b) => {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
};

const FileItem = ({ file, depth = 0 }) => {
  return (
    <Box as="li" pl={`${depth * 22}px`} css={{ lineHeight: 1.75 }}>
      <WrapExpandable wrap={!!file.children.length}>
        <Box
          as="summary"
          _css={{
            cursor: file.children.length ? "pointer" : "caret",
            "&::marker": { color: "grey" },
          }}
        >
          <Text
            fontSize={1}
            icon={file.children.length ? Folder : File}
            iconSize={18}
            iconTextWrapperProps={{ verticalAlign: "middle" }}
          >
            {file.name}
            {file.size !== undefined ? (
              <>
                {" "}
                <Text as="span" color="grey">
                  ({prettyBytes(file.size)})
                </Text>
              </>
            ) : (
              "/"
            )}
          </Text>
        </Box>
        {!!file.children.length && (
          <Box as="ul" pl={0} css={{ listStyle: "none" }}>
            {file.children.sort(sortName).map((child) => (
              <FileItem
                key={`file-${child.name}-${depth}`}
                file={child}
                depth={depth + 1}
              />
            ))}
          </Box>
        )}
      </WrapExpandable>
    </Box>
  );
};

const Torrent = ({ token, torrent = {}, userId, userRole, uid, userStats }) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userVote, setUserVote] = useState(
    (torrent.userHasUpvoted && "up") ||
      (torrent.userHasDownvoted && "down") ||
      null
  );
  const [votes, setVotes] = useState({
    up: torrent.upvotes,
    down: torrent.downvotes,
  });
  const [comments, setComments] = useState(torrent.comments);
  const [isFreeleech, setIsFreeleech] = useState(torrent.freeleech);
  const [hasGroup, setHasGroup] = useState(!!torrent.group);
  const [bookmarked, setBookmarked] = useState(torrent.fetchedBy?.bookmarked);

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const commentInputRef = useRef();

  const {
    publicRuntimeConfig: {
      SQ_API_URL,
      SQ_TORRENT_CATEGORIES,
      SQ_SITE_WIDE_FREELEECH,
      SQ_MINIMUM_RATIO,
      SQ_MAXIMUM_HIT_N_RUNS,
    },
  } = getConfig();

  const router = useRouter();

  const [cookies] = useCookies();

  const { getLocaleString } = useContext(LocaleContext);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const uploadRes = await fetch(
        `${SQ_API_URL}/torrent/edit/${torrent.infoHash}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            type: form.get("category"),
            source: form.get("source"),
            tags: form.get("tags"),
            mediaInfo: form.get("mediaInfo"),
          }),
        }
      );

      if (uploadRes.status !== 200) {
        const reason = await uploadRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("torrTorrEditSuccess")}`);

      window.location.reload();
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldEditTorr")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const deleteRes = await fetch(
        `${SQ_API_URL}/torrent/delete/${torrent.infoHash}`,
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

      addNotification("success", `${getLocaleString("torrTorrDelSuccess")}`);

      router.push("/");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldNotDelTorr")}: ${e.message}`
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
        `${SQ_API_URL}/torrent/comment/${torrent.infoHash}`,
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

  const handleVote = async (vote) => {
    setLoading(true);

    try {
      if (userVote) {
        if (userVote === vote) {
          if (vote === "up") setVotes((v) => ({ up: v.up - 1, down: v.down }));
          else if (vote === "down")
            setVotes((v) => ({ up: v.up, down: v.down - 1 }));
          setUserVote(null);
        } else {
          if (vote === "up") {
            setVotes((v) => ({ up: v.up + 1, down: v.down - 1 }));
          } else if (vote === "down") {
            setVotes((v) => ({ up: v.up - 1, down: v.down + 1 }));
          }
          setUserVote(vote);
        }
      } else {
        if (vote === "up") setVotes((v) => ({ up: v.up + 1, down: v.down }));
        else if (vote === "down")
          setVotes((v) => ({ up: v.up, down: v.down + 1 }));
        setUserVote(vote);
      }

      const voteRes = await fetch(
        `${SQ_API_URL}/torrent/${userVote !== vote ? "vote" : "unvote"}/${
          torrent.infoHash
        }/${vote}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (voteRes.status !== 200) {
        const reason = await voteRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("torrVoteSubmitSuccess")}`);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldNotSubmitVote")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    try {
      const reportRes = await fetch(
        `${SQ_API_URL}/torrent/report/${torrent.infoHash}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: form.get("reason"),
          }),
        }
      );

      if (reportRes.status !== 200) {
        const reason = await reportRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("torrReportSubmitSuccess")}`
      );

      setShowReportModal(false);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldNotSubmitReport")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleToggleFreeleech = async () => {
    setLoading(true);

    try {
      const toggleRes = await fetch(
        `${SQ_API_URL}/torrent/toggle-freeleech/${torrent.infoHash}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (toggleRes.status !== 200) {
        const reason = await toggleRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("torrFLToggleSuccess")}`);

      setIsFreeleech((f) => !f);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldNotToggleFL")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleRemoveFromGroup = async () => {
    setLoading(true);

    try {
      const removeRes = await fetch(
        `${SQ_API_URL}/group/remove/${torrent.infoHash}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (removeRes.status !== 200) {
        const reason = await removeRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("torrTorrRemFromGroupSuccess")}`
      );

      setHasGroup(false);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldNotRemTorrFromGroup")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const handleBookmark = async () => {
    setLoading(true);

    try {
      const bookmarkRes = await fetch(
        `${SQ_API_URL}/torrent/bookmark/${torrent.infoHash}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (bookmarkRes.status !== 200) {
        const reason = await bookmarkRes.text();
        throw new Error(reason);
      }

      addNotification(
        "success",
        `${getLocaleString("torrTorrent")} ${
          bookmarked
            ? getLocaleString("torrRemovedFrom")
            : getLocaleString("torrAddedTo")
        } ${getLocaleString("navBookmarks")}`
      );

      setBookmarked((b) => !b);
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("torrCouldNotBookmarkTorr")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  const category = Object.keys(SQ_TORRENT_CATEGORIES).find(
    (c) => slugify(c, { lower: true }) === torrent.type
  );

  const source = SQ_TORRENT_CATEGORIES[category].find(
    (s) => slugify(s, { lower: true }) === torrent.source
  );

  const parsedFiles = torrent.files
    .map(({ path, size }) => ({ path: path.split("/"), size }))
    .reduce((children, { path, size }) => insert(children, path, size), []);

  const downloadDisabled =
    (Number(SQ_MINIMUM_RATIO) !== -1 &&
      userStats.ratio !== -1 &&
      userStats.ratio < Number(SQ_MINIMUM_RATIO)) ||
    (Number(SQ_MAXIMUM_HIT_N_RUNS) !== -1 &&
      userStats.hitnruns > Number(SQ_MAXIMUM_HIT_N_RUNS));

  function isPngImage(data) {
    const pngHeader = "data:image/png;base64,";
    return data.startsWith(pngHeader);
  }

  return (
    <>
      <SEO title={torrent.name} />
      <Box
        display="flex"
        flexDirection={["column", "row"]}
        alignItems={["flex-start", "center"]}
        justifyContent="space-between"
        mb={5}
      >
        <Text as="h1" mb={[4, 0]}>
          {torrent.name}
          {(torrent.freeleech || SQ_SITE_WIDE_FREELEECH === true) && (
            <Text as="span" fontSize={3} color="primary" ml={3}>
              {getLocaleString("torrFL")}
            </Text>
          )}
        </Text>
        <Box display="flex" alignItems="center" ml={3}>
          {!!userId && (
            <Button
              onClick={handleBookmark}
              variant="secondary"
              px="10px"
              mr={3}
            >
              {bookmarked ? (
                <Bookmark size={18} />
              ) : (
                <BookmarkEmpty size={18} />
              )}
            </Button>
          )}
          {(userRole === "admin" || userId === torrent.uploadedBy._id) && (
            <>
              <Button
                onClick={() => setShowEditModal(true)}
                variant="secondary"
                mr={3}
              >
                {getLocaleString("torrEdit")}
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="secondary"
                mr={3}
              >
                {getLocaleString("reqDelete")}
              </Button>
            </>
          )}
          {userRole === "admin" && (
            <Button onClick={handleToggleFreeleech} variant="secondary" mr={3}>
              {isFreeleech
                ? `${getLocaleString("torrUnset")}`
                : `${getLocaleString("torrSet")}`}{" "}
              {getLocaleString("torrFreeleech")}
            </Button>
          )}
          {userId ? (
            <Button
              as="a"
              href={
                downloadDisabled
                  ? undefined
                  : `${SQ_API_URL}/torrent/download/${torrent.infoHash}/${uid}`
              }
              target="_blank"
              disabled={downloadDisabled}
            >
              {getLocaleString("torrDownload")} .torrent
            </Button>
          ) : (
            <Link href="/login" passHref>
              <Button as="a">{getLocaleString("torrLogInDownload")}</Button>
            </Link>
          )}
        </Box>
      </Box>
      <Info
        items={{
          [getLocaleString("torrUploadedBy")]: torrent.anonymous ? (
            "Anonymous"
          ) : (
            <>
              {torrent.uploadedBy ? (
                <Link href={`/user/${torrent.uploadedBy.username}`} passHref>
                  <Text as="a">{torrent.uploadedBy.username}</Text>
                </Link>
              ) : (
                "deleted user"
              )}
            </>
          ),
          [getLocaleString("uploadCategory")]: category ? (
            <Link
              href={`/categories/${slugify(category, { lower: true })}`}
              passHref
            >
              <Text as="a">{category}</Text>
            </Link>
          ) : undefined,
          [getLocaleString("uploadSource")]: source ? (
            <Link
              href={`/categories/${slugify(category, {
                lower: true,
              })}?source=${slugify(source, { lower: true })}`}
              passHref
            >
              <Text as="a">{source}</Text>
            </Link>
          ) : undefined,
          [getLocaleString("torrDate")]: moment(torrent.created).format(
            `${getLocaleString("indexTime")}`
          ),
          [getLocaleString("reqInfohash")]: (
            <Text
              as="span"
              fontFamily="mono"
              _css={{ userSelect: "all", wordBreak: "break-all" }}
            >
              {torrent.infoHash}
            </Text>
          ),
          [getLocaleString("torrSize")]: prettyBytes(torrent.size),
          [getLocaleString("torrDownloads")]: torrent.downloads,
          [getLocaleString("torrSeeders")]:
            torrent.seeders !== undefined ? torrent.seeders : "?",
          [getLocaleString("torrLeechers")]:
            torrent.leechers !== undefined ? torrent.leechers : "?",
          [getLocaleString("torrFreeleech")]:
            torrent.freeleech || SQ_SITE_WIDE_FREELEECH === true
              ? [getLocaleString("torrYes")]
              : [getLocaleString("torrNo")],
        }}
      />
      {torrent.poster && (
        <Infobox mb={5}>
          <Text
            fontWeight={600}
            fontSize={1}
            _css={{ textTransform: "uppercase" }}
            mb={3}
          >
            {getLocaleString("posterImage")}
          </Text>
          <Box
            as="img"
            src={`data:image/${
              isPngImage(torrent.poster) ? "png" : "jpeg"
            };base64,${torrent.poster}`}
            alt={`Cover image for “${torrent.name}”`}
            width="auto"
            height="auto"
            maxWidth="500px"
            maxHeight="500px"
          />
        </Infobox>
      )}
      <Infobox mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          _css={{ textTransform: "uppercase" }}
          mb={3}
        >
          {getLocaleString("uploadDescription")}
        </Text>
        <MarkdownBody>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {torrent.description}
          </ReactMarkdown>
        </MarkdownBody>
      </Infobox>
      {torrent.mediaInfo && (
        <Infobox mb={5}>
          <Text
            fontWeight={600}
            fontSize={1}
            _css={{ textTransform: "uppercase" }}
            mb={3}
          >
            {getLocaleString("uploadMediaInfo")}
          </Text>
          <Box as="pre" fontFamily="mono" fontSize={1} overflowX="auto">
            {torrent.mediaInfo}
          </Box>
        </Infobox>
      )}
      <Infobox mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          _css={{ textTransform: "uppercase" }}
          mb={3}
        >
          {getLocaleString("uploadTags")}
        </Text>
        {torrent.tags.filter((t) => !!t).length ? (
          <Box display="flex" flexWrap="wrap" ml={-1} mt={-1}>
            {torrent.tags.map((tag) => (
              <Box
                key={`tag-${tag}`}
                bg="background"
                border="1px solid"
                borderColor="border"
                borderRadius={1}
                m={1}
              >
                <Link href={`/tags/${tag}`} passHref>
                  <Text
                    as="a"
                    display="block"
                    color="text"
                    _css={{ "&:visited": { color: "text" } }}
                    px={3}
                    py={1}
                  >
                    {tag}
                  </Text>
                </Link>
              </Box>
            ))}
          </Box>
        ) : (
          <Text color="grey">{getLocaleString("torrTorrNoTags")}</Text>
        )}
      </Infobox>
      <Infobox mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          _css={{ textTransform: "uppercase" }}
          mb={3}
        >
          {getLocaleString("torrFiles")}
        </Text>
        <Box as="ul" pl={0} css={{ listStyle: "none" }}>
          {parsedFiles.sort(sortName).map((file, i) => (
            <FileItem key={`file-${i}`} file={file} />
          ))}
        </Box>
      </Infobox>
      <Box
        display="flex"
        borderBottom="1px solid"
        borderColor="border"
        pb={userId ? 5 : 0}
        mb={5}
      >
        {!!userId && (
          <>
            <Button
              onClick={() => handleVote("up")}
              variant="noBackground"
              mr={2}
            >
              <Text
                icon={Like}
                iconColor={userVote === "up" ? "green" : undefined}
              >
                {votes.up || 0}
              </Text>
            </Button>
            <Button
              onClick={() => handleVote("down")}
              variant="noBackground"
              mr={2}
            >
              <Text
                icon={Dislike}
                iconColor={userVote === "down" ? "red" : undefined}
              >
                {votes.down || 0}
              </Text>
            </Button>
            <Button
              onClick={() => setShowReportModal(true)}
              variant="noBackground"
            >
              {getLocaleString("torrReport")}
            </Button>
          </>
        )}
      </Box>
      <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          width="100%"
          mb={4}
        >
          <Text as="h2">{getLocaleString("torrGroupTorr")}</Text>
          <Box display="flex" justifyContent="flex-end">
            {!!torrent.groupTorrents.length &&
              (userRole === "admin" || userId === torrent.uploadedBy._id) &&
              hasGroup && (
                <Button
                  onClick={handleRemoveFromGroup}
                  variant="secondary"
                  ml={3}
                >
                  {getLocaleString("torrRemTorr")}
                </Button>
              )}
            {!!userId && (
              <Link href={`/upload?groupWith=${torrent.infoHash}`} passHref>
                <Button as="a" ml={3}>
                  {getLocaleString("torrAddTorr")}
                </Button>
              </Link>
            )}
          </Box>
        </Box>
        {torrent.groupTorrents.length && hasGroup ? (
          <TorrentList
            torrents={torrent.groupTorrents}
            categories={SQ_TORRENT_CATEGORIES}
          />
        ) : (
          <Text color="grey">
            {getLocaleString("torrThereAreNoOtherTorrGroup")}
          </Text>
        )}
      </Box>
      <Text as="h2" mb={4}>
        {getLocaleString("userComments")}
      </Text>
      <form onSubmit={userId ? handleComment : undefined}>
        <Input
          ref={commentInputRef}
          name="comment"
          label={getLocaleString("reqPostAComment")}
          rows="5"
          disabled={!userId}
          mb={4}
        />
        <Button disabled={!userId} display="block" ml="auto">
          {getLocaleString("reqPost")}
        </Button>
      </form>
      {!!comments?.length && (
        <Box mt={5}>
          {comments.map((comment) => (
            <Comment
              key={comment._id || comment.created}
              comment={{ ...comment, torrent }}
            />
          ))}
        </Box>
      )}
      {showReportModal && (
        <Modal close={() => setShowReportModal(false)}>
          <form onSubmit={handleReport}>
            <MarkdownInput
              name="reason"
              label={getLocaleString("torrReasonForReport")}
              placeholder={getLocaleString("uploadMarkdownSupport")}
              rows={8}
              mb={4}
              required
            />
            <Button width="100%">{getLocaleString("torrReport")}</Button>
          </form>
        </Modal>
      )}
      {showEditModal && (
        <Modal close={() => setShowEditModal(false)}>
          <form onSubmit={handleEdit}>
            <TorrentFields
              categories={SQ_TORRENT_CATEGORIES}
              values={{
                name: torrent.name,
                category: torrent.type,
                source: torrent.source,
                description: torrent.description,
                tags: torrent.tags.join(", "),
                mediaInfo: torrent.mediaInfo,
              }}
            />
            <Box display="flex" justifyContent="flex-end">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
                mr={3}
              >
                {getLocaleString("accCancel")}
              </Button>
              <Button>{getLocaleString("wikiSaveChanges")}</Button>
            </Box>
          </form>
        </Modal>
      )}
      {showDeleteModal && (
        <Modal close={() => setShowDeleteModal(false)}>
          <Text mb={5}>{getLocaleString("torrSureDeleteTorr")}</Text>
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
  async ({
    token,
    userId,
    fetchHeaders,
    isPublicAccess,
    query: { infoHash },
  }) => {
    if (!token && !isPublicAccess) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { id, role } = token
      ? jwt.verify(token, SQ_JWT_SECRET)
      : { id: null, role: null };

    try {
      const torrentRes = await fetch(`${SQ_API_URL}/torrent/info/${infoHash}`, {
        headers: fetchHeaders,
      });

      if (
        torrentRes.status === 403 &&
        (await torrentRes.text()) === "User is banned"
      ) {
        throw "banned";
      }

      if (torrentRes.status === 404) return { notFound: true };

      const torrent = await torrentRes.json();

      const userStatsRes = await fetch(`${SQ_API_URL}/account/get-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userStats = await userStatsRes.json();

      return {
        props: { torrent, userId: id, userRole: role, uid: userId, userStats },
      };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  },
  true
);

export default Torrent;
