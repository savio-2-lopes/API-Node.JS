const jwt = require('jsonwebtoken')
const authConfig = require('../../config/authToken.json')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader)
    return res.status(401).send({ error: 'Token não encontrado' })

  const parts = authHeader.split(' ')

  if (!parts.length === 2)
    return res.status(401).send({ error: 'Token inválido' })

  const [scheme, token] = parts

  if (!/^Bearer$/i.test(scheme))
    return res.status(401).send({ error: 'Token malformado' })

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) return res.status(401).send({ error: 'Token invalido' })

    req.userId = decoded.id
    return next()
  })
}