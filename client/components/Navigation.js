import React, { useContext, useState, useEffect } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import styled, { ThemeContext } from "styled-components";
import css from "@styled-system/css";
import { X } from "@styled-icons/boxicons-regular/X";
import { Home } from "@styled-icons/boxicons-regular/Home";
import { ListUl } from "@styled-icons/boxicons-regular/ListUl";
import { Search } from "@styled-icons/boxicons-regular/Search";
import { Upload } from "@styled-icons/boxicons-regular/Upload";
import { MessageAdd } from "@styled-icons/boxicons-regular/MessageAdd";
import { News } from "@styled-icons/boxicons-regular/News";
import { BookOpen } from "@styled-icons/boxicons-regular/BookOpen";
import { Rss } from "@styled-icons/boxicons-regular/Rss";
import { Bookmark } from "@styled-icons/boxicons-regular/Bookmark";
import { User } from "@styled-icons/boxicons-regular/User";
import { Error } from "@styled-icons/boxicons-regular/Error";
import { TrendingUp } from "@styled-icons/boxicons-regular/TrendingUp";
import { LogOutCircle } from "@styled-icons/boxicons-regular/LogOutCircle";
import { LogInCircle } from "@styled-icons/boxicons-regular/LogInCircle";
import { UserPlus } from "@styled-icons/boxicons-regular/UserPlus";
import Box from "./Box";
import Text from "./Text";
import Button from "./Button";
import LocaleContext from "../utils/LocaleContext";

const NavLink = styled.a(({ theme, href, highlights = [], mt = 0 }) => {
  const router = useRouter();
  const { asPath } = router;

  const active =
    href === "/"
      ? asPath === "/"
      : asPath.startsWith(href) ||
        highlights.some((link) => asPath.startsWith(link));

  return css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    color: active ? "primary" : `${theme.colors.text} !important`,
    background: active
      ? `linear-gradient(to right, rgba(0, 0, 0, 0), ${theme.colors.border})`
      : "transparent",
    borderRight: "4px solid",
    borderColor: active ? "primary" : "transparent",
    fontWeight: 500,
    lineHeight: 1,
    px: 4,
    py: 3,
    mt,
    svg: {
      ml: 3,
    },
  });
});

const LocaleSelector = styled.select(() =>
  css({
    bg: "sidebar",
    color: "text",
    border: 0,
    fontSize: 0,
    fontFamily: "body",
    cursor: "pointer",
    p: 0,
  })
);

const Navigation = ({ isMobile, menuIsOpen, setMenuIsOpen }) => {
  const [cookies] = useCookies();
  const [role, setRole] = useState("user");
  const [isServer, setIsServer] = useState(true);

  const theme = useContext(ThemeContext);

  const { locale, setLocale, locales, getLocaleString } =
    useContext(LocaleContext);

  const { asPath } = useRouter();

  const { username, token } = cookies;

  const {
    publicRuntimeConfig: {
      SQ_SITE_NAME,
      SQ_API_URL,
      SQ_ALLOW_REGISTER,
      SQ_VERSION,
      SQ_ALLOW_UNREGISTERED_VIEW,
    },
  } = getConfig();

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const roleRes = await fetch(`${SQ_API_URL}/account/get-role`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const role = await roleRes.text();
        setRole(role);
      } catch (e) {}
    };
    if (token) getUserRole();
    setIsServer(false);
  }, [token]);

  useEffect(() => {
    if (isMobile && menuIsOpen) setMenuIsOpen(false);
  }, [asPath]);

  if (isMobile && !menuIsOpen) return null;

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width={`calc((100vw - ${theme.sizes.body}) / 2)`}
      minWidth="200px"
      bg="sidebar"
      borderRight="1px solid"
      borderColor="border"
      textAlign="right"
      zIndex={10}
    >
      <Box
        as="header"
        display="flex"
        alignItems="center"
        justifyContent={["space-between", "flex-end"]}
        width="100%"
        height="60px"
        borderBottom="1px solid"
        borderColor="border"
        px={4}
      >
        <Button
          onClick={() => setMenuIsOpen(false)}
          variant="secondary"
          display={["block", "none"]}
          px={1}
          py={1}
        >
          <X size={20} />
        </Button>
        <Link href="/" passHref>
          <Text
            as="a"
            fontSize={[2, 3]}
            fontWeight={600}
            color="text"
            _css={{ textDecoration: "none", "&:visited": { color: "text" } }}
          >
            {SQ_SITE_NAME}
          </Text>
        </Link>
      </Box>
      {!isServer && (
        <Box as="nav" maxWidth="300px" ml="auto" py={4}>
          {token ? (
            <Box display="grid" gridAutoFlow="row" gridGap={0}>
              <Link href="/" passHref>
                <NavLink>
                  <Text>{getLocaleString("navHome")}</Text>
                  <Home size={24} />
                </NavLink>
              </Link>
              <Link href="/categories" passHref>
                <NavLink>
                  <Text>{getLocaleString("navBrowse")}</Text>
                  <ListUl size={24} />
                </NavLink>
              </Link>
              <Link href="/search" passHref>
                <NavLink>
                  <Text>{getLocaleString("navSearch")}</Text>
                  <Search size={24} />
                </NavLink>
              </Link>
              <Link href="/upload" passHref>
                <NavLink>
                  <Text>{getLocaleString("navUpload")}</Text>
                  <Upload size={24} />
                </NavLink>
              </Link>
              <Link href="/requests" passHref>
                <NavLink>
                  <Text>{getLocaleString("navRequests")}</Text>
                  <MessageAdd size={24} />
                </NavLink>
              </Link>
              <Link href="/announcements" passHref>
                <NavLink>
                  <Text>{getLocaleString("navAnnouncements")}</Text>
                  <News size={24} />
                </NavLink>
              </Link>
              <Link href="/wiki" passHref>
                <NavLink>
                  <Text>{getLocaleString("navWiki")}</Text>
                  <BookOpen size={24} />
                </NavLink>
              </Link>
              <Link href="/rss" passHref>
                <NavLink>
                  <Text>{getLocaleString("navRSS")}</Text>
                  <Rss size={24} />
                </NavLink>
              </Link>
              <Link href="/bookmarks" passHref>
                <NavLink>
                  <Text>{getLocaleString("navBookmarks")}</Text>
                  <Bookmark size={24} />
                </NavLink>
              </Link>
              <Link href={`/user/${username}`} passHref>
                <NavLink highlights={["/account"]}>
                  <Text>{username}</Text>
                  <User size={24} />
                </NavLink>
              </Link>
              {role === "admin" && (
                <>
                  <Link href="/reports" passHref>
                    <NavLink highlights={["/reports"]}>
                      <Text>{getLocaleString("navReports")}</Text>
                      <Error size={24} />
                    </NavLink>
                  </Link>
                  <Link href="/stats" passHref>
                    <NavLink highlights={["/stats"]}>
                      <Text>{getLocaleString("navStats")}</Text>
                      <TrendingUp size={24} />
                    </NavLink>
                  </Link>
                </>
              )}
              <Link href="/logout" passHref>
                <NavLink mt={5}>
                  <Text>{getLocaleString("navLogOut")}</Text>
                  <LogOutCircle size={24} />
                </NavLink>
              </Link>
            </Box>
          ) : (
            <Box display="grid" gridAutoFlow="row" gridGap={0}>
              <Link href="/login" passHref>
                <NavLink>
                  <Text>{getLocaleString("logIn")}</Text>
                  <LogInCircle size={24} />
                </NavLink>
              </Link>
              {(SQ_ALLOW_REGISTER === "open" ||
                SQ_ALLOW_REGISTER === "invite") && (
                <Link href="/register" passHref>
                  <NavLink>
                    <Text>{getLocaleString("register")}</Text>
                    <UserPlus size={24} />
                  </NavLink>
                </Link>
              )}
              {SQ_ALLOW_UNREGISTERED_VIEW && (
                <>
                  <Link href="/categories" passHref>
                    <NavLink>
                      <Text>{getLocaleString("navBrowse")}</Text>
                      <ListUl size={24} />
                    </NavLink>
                  </Link>
                  <Link href="/wiki" passHref>
                    <NavLink>
                      <Text>{getLocaleString("navWiki")}</Text>
                      <BookOpen size={24} />
                    </NavLink>
                  </Link>
                </>
              )}
            </Box>
          )}
        </Box>
      )}
      <Box
        as="footer"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        borderTop="1px solid"
        borderColor="border"
        p={3}
      >
        <Text color="grey" fontSize={0}>
          {getLocaleString("poweredBy")}{" "}
          <a
            href="https://github.com/tdjsnelling/sqtracker"
            target="_blank"
            rel="noreferrer"
          >
            ■ sqtracker
          </a>{" "}
          v{SQ_VERSION}
        </Text>
        <LocaleSelector
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        >
          {locales.sort().map((l) => (
            <option key={`locale-${l}`} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </LocaleSelector>
      </Box>
    </Box>
  );
};

export default Navigation;
