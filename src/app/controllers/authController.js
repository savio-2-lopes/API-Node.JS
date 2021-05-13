const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const authConfig = require('../../config/authToken.json')
const mailer = require('../../modules/mailer')

const User = require('../models/User')
const router = express.Router()

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400
  })
}

// Rota de Cadastro
router.post('/cadastrar', async (req, res) => {
  const { email } = req.body
  try {
    if (await User.findOne({ email }))
      return res.status(400).send({ error: 'Usuario existente' })

    const user = await User.create(req.body);
    user.password = undefined

    return res.send({
      user,
      token: generateToken({ id: user.id })
    })
  } catch (err) {
    return res.status(400).send({ error: 'Falha no cadastro' })
  }
})

// Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password')

  if (!user)
    return res.status(400).send({ error: 'Usuario não encontrado' })

  if (!await bcrypt.compare(password, user.password))
    return res.status(400).send({ error: 'Senha invalida' })

  user.password = undefined

  res.send({
    user,
    token: generateToken({ id: user.id })
  })
})

// Rota de esqueceu a senha
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })

    if (!user)
      return res.status(400).send({ error: 'Usuario não encontrado' })

    const token = crypto.randomBytes(20).toString('hex')
    const now = new Date()
    now.setHours(now.getHours() + 1)

    await User.findByIdAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now
      }
    });
    console.log(token, now);
    mailer.sendMail({
      to: email,
      from: 'savioaugulopes@gmail.com',
      template: 'auth/forgot_password',
      context: { token }
    }, (err) => {
      if (err)
        return res.status(400).send({ error: 'Cannot send forgot password email' })
      return res.send()
    })
  } catch (err) {
    res.status(400).send({ error: 'Erro em obter nova senha, tente novamente' })
  }
})

// Rota de resetar senha 
router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body

  try {
    const user = await User.findOne({ email })
      .select('+passwordResetToken passwordResetExpires')

    if (!user)
      return res.status(400).send({ error: 'User not found' })

    if (token !== user.passwordResetToken)
      return res.status(400).send({ error: 'Token invalid' })

    const now = new Date()

    if (now > user.passwordResetExpires)
      return res.status(400).send({ error: 'Token expired, generate a new one' })

    user.password = password
    await user.save()
    res.send()

  } catch (err) {
    res.status(400).send({ error: 'Cannot reset password, try again' })
  }
})

module.exports = app => app.use('/auth', router)