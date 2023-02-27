import Wiki from "../schema/wiki";

const slugRegex = /^\/([a-z0-9-_\/])*/i;

export const createWiki = async (req, res, next) => {
  if (req.body.slug && req.body.title && req.body.body) {
    try {
      if (req.userRole !== "admin") {
        res
          .status(401)
          .send("You do not have permission to create a wiki page");
        return;
      }

      const validSlug = slugRegex.test(req.body.slug);

      if (!validSlug) {
        res.status(400).send("That is not a valid path");
        return;
      }

      const existing = await Wiki.findOne({ slug: req.body.slug }).lean();

      if (existing) {
        res
          .status(409)
          .send(
            "Wiki page with this slug already exists. Please choose something unique."
          );
        return;
      }

      const wiki = new Wiki({
        slug: req.body.slug,
        title: req.body.title,
        body: req.body.body,
        createdBy: req.userId,
        created: Date.now(),
      });

      await wiki.save();
      res.send(req.body.slug);
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

    const [page] = await Wiki.aggregate([
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

    res.json(page);
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

      const validSlug = slugRegex.test(req.body.slug);

      if (!validSlug) {
        res.status(400).send("That is not a valid path");
        return;
      }

      if (req.body.slug !== existing.slug) {
        const existingSlug = await Wiki.findOne({ slug: req.body.slug }).lean();

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
            slug: req.body.slug,
            title: req.body.title,
            body: req.body.body,
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
