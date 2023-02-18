import express from 'express'
import {
  fetchInvites,
  generateInvite,
  changePassword,
  getUserStats,
  getUserRole,
  getUserVerifiedEmailStatus,
  buyItems,
  generateTotpSecret,
  enableTotp,
  disableTotp,
} from '../controllers/user'

const router = express.Router()

export default () => {
  router.get('/invites', fetchInvites)
  router.post('/generate-invite', generateInvite)
  router.post('/change-password', changePassword)
  router.get('/get-stats', getUserStats)
  router.get('/get-role', getUserRole)
  router.get('/get-verified', getUserVerifiedEmailStatus)
  router.post('/buy', buyItems)
  router.get('/totp/generate', generateTotpSecret)
  router.post('/totp/enable', enableTotp)
  router.post('/totp/disable', disableTotp)
  return router
}
