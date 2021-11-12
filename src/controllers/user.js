import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'
import User from '../schema/user'
import Invite from '../schema/invite'

dotenv.config()

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
            'Registration is closed. Please provide a valid invitation token'
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
          })
        } else {
          res.sendStatus(401)
        }
      } else {
        res.sendStatus(404)
      }
    } catch (err) {
      console.error(err)
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

  invite.token = jwt.sign({ id: invite._id }, process.env.SQ_JWT_SECRET)

  const createdInvite = await invite.save()

  if (createdInvite) {
    res.send(createdInvite)
  }
}
