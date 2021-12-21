import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../schema/user'
import Invite from '../schema/invite'
import { getUserRatio } from '../utils/ratio'

export const register = async (req, res) => {
  if (
    process.env.SQ_ALLOW_REGISTER !== 'open' &&
    process.env.SQ_ALLOW_REGISTER !== 'invite'
  ) {
    res.status(403).send('Registration is currently closed')
    return
  }

  if (req.body.username && req.body.email && req.body.password) {
    if (process.env.SQ_ALLOW_REGISTER === 'invite') {
      if (!req.body.invite) {
        res
          .status(403)
          .send(
            'Registration is currently invite only. Please provide a valid invitation token'
          )
        return
      }

      try {
        const decoded = jwt.verify(req.body.invite, process.env.SQ_JWT_SECRET)
        const { id } = decoded

        const invite = await Invite.findOne({ _id: id }).lean()
        const { claimed, validUntil, invitingUser } = invite

        if (claimed) {
          res.status(403).send('Invitation has already been claimed')
          return
        }

        if (validUntil < Date.now()) {
          res.status(403).send('Invitation has expired')
          return
        }

        const inviter = User.findOne({ _id: invitingUser }).lean()
        if (!inviter || inviter.banned) {
          res.status(403).send('Inviting user doesn’t exist or has been banned')
          return
        }

        await Invite.findOneAndUpdate({ _id: id }, { $set: { claimed: true } })
      } catch (err) {
        res.status(500).send(`Error verifying invitation: ${err.message}`)
        return
      }
    }

    const created = Date.now()

    try {
      const user = await User.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
      })

      if (!user) {
        const hash = await bcrypt.hash(req.body.password, 10)

        const newUser = new User({
          username: req.body.username,
          email: req.body.email,
          password: hash,
          torrents: {},
          created,
        })

        newUser.uid = crypto
          .createHash('sha256')
          .update(newUser._id.toString())
          .digest('hex')
          .slice(0, 10)

        newUser.token = jwt.sign(
          {
            id: newUser._id,
            created: created,
          },
          process.env.SQ_JWT_SECRET
        )

        const createdUser = await newUser.save()

        if (createdUser) {
          res.send({
            token: createdUser.token,
            id: createdUser._id,
            uid: createdUser.uid,
            username: createdUser.username,
          })
        } else {
          res.status(500).send('User could not be created')
        }
      } else {
        res.sendStatus(409)
      }
    } catch (err) {
      res.status(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const login = async (req, res) => {
  if (req.body.username && req.body.password) {
    try {
      const user = await User.findOne({ username: req.body.username })

      if (user) {
        const matches = await bcrypt.compare(req.body.password, user.password)

        if (matches) {
          res.send({
            token: user.token,
            id: user._id,
            uid: user.uid,
            username: user.username,
          })
        } else {
          res.sendStatus(401)
        }
      } else {
        res.sendStatus(404)
      }
    } catch (err) {
      res.status(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const generateInvite = async (req, res) => {
  const created = Date.now()
  const validUntil = created + 48 * 60 * 60 * 1000

  const invite = new Invite({
    invitingUser: req.userId,
    created,
    validUntil,
    claimed: false,
  })

  invite.token = jwt.sign(
    { id: invite._id, validUntil },
    process.env.SQ_JWT_SECRET
  )

  const createdInvite = await invite.save()

  if (createdInvite) {
    res.send(createdInvite)
  }
}

export const changePassword = async (req, res) => {
  if (req.body.password && req.body.newPassword) {
    try {
      const user = await User.findOne({ _id: req.userId }).lean()

      if (!user) {
        res.status(404).send('User does not exist')
        return
      }

      const matches = await bcrypt.compare(req.body.password, user.password)

      if (!matches) {
        res.status(401).send('Incorrect password')
        return
      }

      const hash = await bcrypt.hash(req.body.newPassword, 10)

      await User.findOneAndUpdate(
        { _id: req.userId },
        { $set: { password: hash } }
      )

      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const initiatePasswordReset = async (req, res) => {
  if (req.body.email) {
    try {
      const user = await User.findOne({ email: req.body.email }).lean()

      if (!user) {
        res.status(404).send('User does not exist')
        return
      }

      const token = jwt.sign(
        {
          user: req.body.email,
          validUntil: Date.now() + 24 * 60 * 60 * 1000,
          key: crypto
            .createHash('sha256')
            .update(user.password)
            .digest('hex')
            .substr(0, 6),
        },
        process.env.SQ_JWT_SECRET
      )

      res.send(token)
    } catch (err) {
      res.send(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const finalisePasswordReset = async (req, res) => {
  if (req.body.email && req.body.newPassword && req.body.token) {
    try {
      const user = await User.findOne({ email: req.body.email }).lean()

      if (!user) {
        res.status(404).send('User does not exist')
        return
      }

      const {
        user: email,
        validUntil,
        key,
      } = jwt.verify(req.body.token, process.env.SQ_JWT_SECRET)

      if (email !== req.body.email) {
        res.status(403).send('Token is invalid')
        return
      }

      const calculatedKey = crypto
        .createHash('sha256')
        .update(user.password)
        .digest('hex')
        .substr(0, 6)

      if (key !== calculatedKey) {
        res.status(403).send('Token has already been used')
        return
      }

      if (validUntil < Date.now()) {
        res.status(403).send('Token has expired')
        return
      }

      const newHash = await bcrypt.hash(req.body.newPassword, 10)

      await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { password: newHash } }
      )

      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const fetchUser = async (req, res) => {
  try {
    const { username } = req.params

    const [user] = await User.aggregate([
      {
        $match: { username },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          created: 1,
        },
      },
      {
        $lookup: {
          from: 'torrents',
          as: 'torrents',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$uploadedBy', '$$userId'] },
                anonymous: false,
              },
            },
            { $project: { binary: 0 } },
          ],
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'userId',
          as: 'comments',
        },
      },
      {
        $lookup: {
          from: 'progresses',
          as: 'downloaded',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
                downloaded: { $gt: 0 },
              },
            },
            { $count: 'count' },
          ],
        },
      },
      {
        $lookup: {
          from: 'progresses',
          as: 'uploaded',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
                uploaded: { $gt: 0 },
              },
            },
            { $count: 'count' },
          ],
        },
      },
      { $unwind: { path: '$downloaded', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$uploaded', preserveNullAndEmptyArrays: true } },
    ])

    if (!user) {
      res.status(404).send('User does not exist')
      return
    }

    user.ratio = await getUserRatio(user._id)

    res.json(user)
  } catch (e) {
    console.error(e)
    res.status(500).send(e.message)
  }
}
