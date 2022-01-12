import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../schema/user'

const createAdminUser = async () => {
  const existingAdmin = await User.findOne({ username: 'admin' }).lean()
  if (!existingAdmin) {
    const created = Date.now()
    const hash = await bcrypt.hash('admin', 10)
    const adminUser = new User({
      username: 'admin',
      email: 'admin@sqtracker',
      role: 'admin',
      password: hash,
      created,
    })
    adminUser.uid = crypto
      .createHash('sha256')
      .update(adminUser._id.toString())
      .digest('hex')
      .slice(0, 10)
    adminUser.token = jwt.sign(
      {
        id: adminUser._id,
        created,
        role: 'admin',
      },
      process.env.SQ_JWT_SECRET
    )
    await adminUser.save()
  }
}

export default createAdminUser
