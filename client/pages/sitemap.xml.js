import getConfig from "next/config";

const Sitemap = () => {};

export const getServerSideProps = async ({ req, res }) => {
  const {
    publicRuntimeConfig: {
      SQ_BASE_URL,
      SQ_API_URL,
      SQ_ALLOW_UNREGISTERED_VIEW,
    },
    serverRuntimeConfig: { SQ_SERVER_SECRET },
  } = getConfig();

  const urls = [SQ_BASE_URL, `${SQ_BASE_URL}/login`, `${SQ_BASE_URL}/register`];

  if (SQ_ALLOW_UNREGISTERED_VIEW) {
    try {
      const listRes = await fetch(`${SQ_API_URL}/torrent/all`, {
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For":
            req.headers["x-forwarded-for"] ?? req.socket.remoteAddress,
          "X-Sq-Server-Secret": SQ_SERVER_SECRET,
          "X-Sq-Public-Access": true,
        },
      });
      const torrents = await listRes.json();
      for (const { infoHash } of torrents) {
        urls.push(`${SQ_BASE_URL}/torrent/${infoHash}`);
      }
    } catch (e) {
      console.error(`[sq] could not list torrents: ${e}`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map(
        (url) => `<url>
        <loc>${url}</loc>
    </url>`
      )
      .join("\n")}
</urlset>
`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default Sitemap;
