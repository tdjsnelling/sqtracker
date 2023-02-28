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

const FileItem = ({ file, depth = 0 }) => (
  <Box as="li" pl={`${depth * 22}px`} css={{ lineHeight: 1.75 }}>
    <Text
      fontSize={1}
      icon={file.children.length ? Folder : File}
      iconSize={18}
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
    {!!file.children.length && (
      <Box as="ul" pl={0} css={{ listStyle: "none" }}>
        {file.children.map((child) => (
          <FileItem
            key={`file-${child.name}-${depth}`}
            file={child}
            depth={depth + 1}
          />
        ))}
      </Box>
    )}
  </Box>
);

const Torrent = ({ token, torrent = {}, userId, userRole, uid }) => {
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
  const [bookmarked, setBookmarked] = useState(torrent.fetchedBy.bookmarked);

  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const commentInputRef = useRef();

  const {
    publicRuntimeConfig: {
      SQ_API_URL,
      SQ_TORRENT_CATEGORIES,
      SQ_SITE_WIDE_FREELEECH,
    },
  } = getConfig();

  const router = useRouter();

  const [cookies] = useCookies();

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
          }),
        }
      );

      if (uploadRes.status !== 200) {
        const reason = await uploadRes.text();
        throw new Error(reason);
      }

      addNotification("success", "Torrent edited successfully");

      window.location.reload();
    } catch (e) {
      addNotification("error", `Could edit torrent: ${e.message}`);
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

      addNotification("success", "Torrent deleted successfully");

      router.push("/");
    } catch (e) {
      addNotification("error", `Could not delete torrent: ${e.message}`);
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

      addNotification("success", "Comment posted successfully");

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
      addNotification("error", `Could not post comment: ${e.message}`);
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

      addNotification("success", "Vote submitted successfully");
    } catch (e) {
      addNotification("error", `Could not submit vote: ${e.message}`);
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

      addNotification("success", "Report submitted successfully");

      setShowReportModal(false);
    } catch (e) {
      addNotification("error", `Could not submit report: ${e.message}`);
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

      addNotification("success", "Freeleech toggled successfully");

      setIsFreeleech((f) => !f);
    } catch (e) {
      addNotification("error", `Could not toggle freeleech: ${e.message}`);
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

      addNotification("success", "Torrent removed from group successfully");

      setHasGroup(false);
    } catch (e) {
      addNotification(
        "error",
        `Could not remove torrent from group: ${e.message}`
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
        `Torrent ${bookmarked ? "removed from" : "added to"} bookmarks`
      );

      setBookmarked((b) => !b);
    } catch (e) {
      addNotification("error", `Could not bookmark torrent: ${e.message}`);
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
              FL!
            </Text>
          )}
        </Text>
        <Box display="flex" alignItems="center" ml={3}>
          <Button onClick={handleBookmark} variant="secondary" px="10px" mr={3}>
            {bookmarked ? <Bookmark size={18} /> : <BookmarkEmpty size={18} />}
          </Button>
          {(userRole === "admin" || userId === torrent.uploadedBy._id) && (
            <>
              <Button
                onClick={() => setShowEditModal(true)}
                variant="secondary"
                mr={3}
              >
                Edit
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="secondary"
                mr={3}
              >
                Delete
              </Button>
            </>
          )}
          {userRole === "admin" && (
            <Button onClick={handleToggleFreeleech} variant="secondary" mr={3}>
              {isFreeleech ? "Unset" : "Set"} freeleech
            </Button>
          )}
          <Button
            as="a"
            href={`${SQ_API_URL}/torrent/download/${torrent.infoHash}/${uid}`}
            target="_blank"
          >
            Download .torrent
          </Button>
        </Box>
      </Box>
      <Info
        items={{
          "Uploaded by": torrent.anonymous ? (
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
          Category: category ? (
            <Link
              href={`/categories/${slugify(category, { lower: true })}`}
              passHref
            >
              <Text as="a">{category}</Text>
            </Link>
          ) : undefined,
          Source: source ? (
            <Link
              href={`/categories/${slugify(category, {
                lower: true,
              })}?source=${slugify(source, { lower: true })}`}
              passHref
            >
              <Text as="a">{source}</Text>
            </Link>
          ) : undefined,
          Date: moment(torrent.created).format("HH:mm Do MMM YYYY"),
          "Info hash": (
            <Text
              as="span"
              fontFamily="mono"
              _css={{ userSelect: "all", wordBreak: "break-all" }}
            >
              {torrent.infoHash}
            </Text>
          ),
          Size: prettyBytes(torrent.size),
          Downloads: torrent.downloads,
          Seeders: torrent.seeders !== undefined ? torrent.seeders : "?",
          Leechers: torrent.leechers !== undefined ? torrent.leechers : "?",
          Freeleech:
            torrent.freeleech || SQ_SITE_WIDE_FREELEECH === true ? "Yes" : "No",
        }}
      />
      <Box mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          _css={{ textTransform: "uppercase" }}
          mb={3}
        >
          Description
        </Text>
        <MarkdownBody>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {torrent.description}
          </ReactMarkdown>
        </MarkdownBody>
      </Box>
      <Box mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          _css={{ textTransform: "uppercase" }}
          mb={3}
        >
          Tags
        </Text>
        {torrent.tags.filter((t) => !!t).length ? (
          <Box display="flex" flexWrap="wrap" ml={-1} mt={-1}>
            {torrent.tags.map((tag) => (
              <Box
                key={`tag-${tag}`}
                bg="sidebar"
                border="1px solid"
                borderColor="border"
                borderRadius={1}
                m={1}
              >
                <Link href={`/tags/${tag}`} passHref>
                  <Text as="a" display="block" color="text" px={3} py={1}>
                    {tag}
                  </Text>
                </Link>
              </Box>
            ))}
          </Box>
        ) : (
          <Text color="grey">This torrent has no tags.</Text>
        )}
      </Box>
      <Infobox mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          _css={{ textTransform: "uppercase" }}
          mb={3}
        >
          Files
        </Text>
        <Box as="ul" pl={0} css={{ listStyle: "none" }}>
          {parsedFiles.map((file, i) => (
            <FileItem key={`file-${i}`} file={file} />
          ))}
        </Box>
      </Infobox>
      <Box
        display="flex"
        borderBottom="1px solid"
        borderColor="border"
        pb={5}
        mb={5}
      >
        <Button onClick={() => handleVote("up")} variant="noBackground" mr={2}>
          <Text icon={Like} iconColor={userVote === "up" ? "green" : undefined}>
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
        <Button onClick={() => setShowReportModal(true)} variant="noBackground">
          Report
        </Button>
      </Box>
      <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          width="100%"
          mb={4}
        >
          <Text as="h2">Grouped torrents</Text>
          <Box display="flex" justifyContent="flex-end">
            {!!torrent.groupTorrents.length &&
              (userRole === "admin" || userId === torrent.uploadedBy._id) &&
              hasGroup && (
                <Button
                  onClick={handleRemoveFromGroup}
                  variant="secondary"
                  ml={3}
                >
                  Remove this torrent
                </Button>
              )}
            <Link href={`/upload?groupWith=${torrent.infoHash}`} passHref>
              <Button as="a" ml={3}>
                Add a torrent
              </Button>
            </Link>
          </Box>
        </Box>
        {torrent.groupTorrents.length && hasGroup ? (
          <TorrentList
            torrents={torrent.groupTorrents}
            categories={SQ_TORRENT_CATEGORIES}
          />
        ) : (
          <Text color="grey">There are no other torrents in this group.</Text>
        )}
      </Box>
      <Text as="h2" mb={4}>
        Comments
      </Text>
      <form onSubmit={handleComment}>
        <Input
          ref={commentInputRef}
          name="comment"
          label="Post a comment"
          rows="5"
          mb={4}
        />
        <Button display="block" ml="auto">
          Post
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
              label="Reason for report"
              placeholder="Markdown supported"
              rows={8}
              mb={4}
              required
            />
            <Button width="100%">Report</Button>
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
              }}
            />
            <Box display="flex" justifyContent="flex-end">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
                mr={3}
              >
                Cancel
              </Button>
              <Button>Save changes</Button>
            </Box>
          </form>
        </Modal>
      )}
      {showDeleteModal && (
        <Modal close={() => setShowDeleteModal(false)}>
          <Text mb={5}>
            Are you sure you want to delete this torrent? This cannot be undone.
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
  async ({ token, userId, fetchHeaders, query: { infoHash } }) => {
    if (!token) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { id, role } = jwt.verify(token, SQ_JWT_SECRET);

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
      return { props: { torrent, userId: id, userRole: role, uid: userId } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Torrent;
