const express = require('express')
const authMiddleware = require('../middlewares/auth')

const Project = require('../models/Project')
const Task = require('../models/Task')

const router = express.Router()

router.use(authMiddleware)

// Exibindo todos os projetos criados
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate(['user', 'tasks'])
    return res.send({ projects })
  } catch (err) {
    return res.status(400).send({ error: 'Erro para carregar projeto' })
  }
})

// Exibindo projeto criado
router.get('/:projectId', async (req, res) => {
  try {
    const project = await (await Project.findById(req.params.projectId)).populate(['user', 'tasks'])
    return res.send({ project })
  } catch (err) {
    return res.status(400).send({ error: 'Erro para exibir kanbam' })
  }
})

// Criando novo projeto
router.post('/', async (req, res) => {
  try {
    const { title, description, tasks } = req.body
    const project = await Project.create({ title, description, user: req.userId })
    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id })
      await projectTask.save()
      project.tasks.push(projectTask)
    }))
    await project.save()
    return res.send({ project })
  } catch (err) {
    return res.status(400).send({ error: 'Erro para criar novo kanbam' })
  }
})

// Atualizando projeto criado
router.put('/:projectId', async (req, res) => {
  try {
    const { title, description, tasks } = req.body
    const project = await Project.findByIdAndUpdate(req.params.projectId, {
      title,
      description
    }, { new: true })

    project.task = []

    await tasks.remove({ project: project._id })
    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id })

      await projectTask.save()
      project.tasks.push(projectTask)
    }))
    await project.save()
    return res.send({ project })
  } catch (err) {
    return res.status(400).send({ error: 'Erro para atualizar kanban' })
  }
})

// Deletando projeto criado
router.delete('/:projectId', async (req, res) => {
  try {
    await Project.findByIdAndRemove(req.params.projectId)
    return res.send()
  } catch (err) {
    return res.status(400).send({ error: 'Erro para deletar kanbam' })
  }
})

module.exports = app => app.use('/projects', router)