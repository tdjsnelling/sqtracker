import slugify from "slugify";
import Wiki from "../schema/wiki";

const slugRegex = /^\/([a-z0-9-_\/])*/i;

const formatSlug = (slug) => {
  if (!slug.startsWith("/")) slug = `/${slug}`;
  if (slug.endsWith("/") && slug !== "/") slug = slug.slice(0, -1);
  const split = slug.split("/");
  const slugified = split.map((token) => slugify(token, { lower: true }));
  return slugified.join("/");
};

export const createWiki = async (req, res, next) => {
  if (req.body.slug && req.body.title && req.body.body) {
    try {
      if (req.userRole !== "admin") {
        res
          .status(401)
          .send("You do not have permission to create a wiki page");
        return;
      }

      let { slug } = req.body;
      slug = formatSlug(slug);

      const validSlug = slugRegex.test(slug);

      if (!validSlug) {
        res.status(400).send("That is not a valid path");
        return;
      }

      const existing = await Wiki.findOne({ slug }).lean();

      if (existing) {
        res
          .status(409)
          .send(
            "Wiki page with this slug already exists. Please choose something unique."
          );
        return;
      }

      const wiki = new Wiki({
        slug,
        title: req.body.title,
        body: req.body.body,
        createdBy: req.userId,
        public: !!req.body.public,
        created: Date.now(),
      });

      await wiki.save();
      res.send(slug);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include slug, title and body");
  }
};

export const getWiki = async (req, res, next) => {
  try {
    const slug = req.params[0];

    let [page] = await Wiki.aggregate([
      {
        $match: { slug },
      },
      {
        $lookup: {
          from: "users",
          as: "createdBy",
          let: { userId: "$createdBy" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$userId"] } },
            },
            {
              $project: {
                username: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!page) {
      res.status(404).send("Wiki page does not exist");
      return;
    }

    if (process.env.SQ_ALLOW_UNREGISTERED_VIEW && !req.userId && !page.public) {
      page = null;
    }

    const query = {};

    if (process.env.SQ_ALLOW_UNREGISTERED_VIEW && !req.userId) {
      query.public = true;
    }

    const allPages = await Wiki.find(query, { slug: 1, title: 1 }).lean();

    res.json({ page, allPages });
  } catch (e) {
    next(e);
  }
};
export const getWikis = async (req, res, next) => {
  try {
    const result = await Wiki.aggregate([
      {
        $lookup: {
          from: "users",
          as: "createdBy",
          let: { userId: "$createdBy" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$userId"] } },
            },
            {
              $project: {
                username: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    if (!result || result.length === 0) {
      res.status(404).send("No wikis found");
      return;
    }
    let page = result[0];
    if (process.env.SQ_ALLOW_UNREGISTERED_VIEW && !req.userId && !page.public) {
      page = null;
    }
    const query = {};
    if (process.env.SQ_ALLOW_UNREGISTERED_VIEW && !req.userId) {
      query.public = true;
    }
    const allPages = await Wiki.find(query, { slug: 1, title: 1 }).lean();
    res.json({ page, allPages });
  } catch (e) {
    next(e);
  }
};
export const deleteWiki = async (req, res, next) => {
  try {
    if (req.userRole !== "admin") {
      res.status(401).send("You do not have permission to delete a wiki page");
      return;
    }

    const slug = req.params[0];

    await Wiki.deleteOne({ slug });
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const updateWiki = async (req, res, next) => {
  if (req.body.slug && req.body.title && req.body.body) {
    try {
      if (req.userRole !== "admin") {
        res
          .status(401)
          .send("You do not have permission to create a wiki page");
        return;
      }

      const existing = await Wiki.findOne({ _id: req.params.wikiId }).lean();

      if (!existing) {
        res.status(404).send("That wiki page does not exist");
        return;
      }

      if (existing.slug === "/" && req.body.slug !== "/") {
        res.status(400).send("Root page cannot be moved to a different path");
        return;
      }

      let { slug } = req.body;
      slug = formatSlug(slug);

      const validSlug = slugRegex.test(slug);

      if (!validSlug) {
        res.status(400).send("That is not a valid path");
        return;
      }

      if (slug !== existing.slug) {
        const existingSlug = await Wiki.findOne({ slug }).lean();

        if (existingSlug) {
          res
            .status(409)
            .send(
              "Wiki page with this slug already exists. Please choose something unique."
            );
          return;
        }
      }

      await Wiki.findOneAndUpdate(
        { _id: req.params.wikiId },
        {
          $set: {
            slug,
            title: req.body.title,
            body: req.body.body,
            public: !!req.body.public,
            updated: Date.now(),
          },
        }
      );

      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include slug, title and body");
  }
};
