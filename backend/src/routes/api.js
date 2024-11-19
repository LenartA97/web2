import { Router } from 'express'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { upload } from '../utils/upload.js'

config()
const { TOKEN_SECRET } = process.env
const router = Router()

const todoSchema = new mongoose.Schema({
  text: { type: String, trim: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: new Date() },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    required: true,
  },
  password: { type: String, select: false, required: true },
  registeredAt: { type: Date, default: new Date(), select: false },
})

todoSchema.set('toJSON', {
  virtuals: true,
})

const Todo = mongoose.model('Todo', todoSchema)
const User = mongoose.model('User', userSchema)

const authMW = async (req, res, next) => {
  const token = req.headers?.authorization?.replace('Bearer ', '')
  try {
    const { userId } = await jwt.verify(token, TOKEN_SECRET)
    req.user = userId
    next()
  } catch (error) {
    next(error)
  }
}

router.get('/heartbeat', async (req, res) => {
  res.json({ connection: 'true' })
})

router.post('/register', async (req, res, next) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (user) {
    next('User exists')
  } else {
    const hashed = await bcrypt.hash(password, 10)
    const createdUser = await User.create({ username, password: hashed })
    res.json(createdUser)
  }
})

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body
  const user = await User.findOne({ username }).select('+password')
  if (!user) {
    next('No such user')
  } else {
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      next('Wrong password')
    } else {
      const token = await jwt.sign({ userId: user.id }, TOKEN_SECRET, {
        expiresIn: '1h',
      })
      res.json({ token })
    }
  }
})

// GET / -> all todo
router.get('/', authMW, async (req, res) => {
  const todos = await Todo.find({ createdBy: req.user })
  res.json(todos)
})
// GET /todos -> all todo
router.get('/todos', authMW, async (req, res) => {
  res.redirect('/')
})

// GET /todos/:id -> get todo by id
router.get('/todos/:id', authMW, async (req, res) => {
  const { id } = req.params
  const todo = await Todo.findById(id)
  res.json(todo)
})
// POST /todos -> create todo
router.post('/todos', authMW, async (req, res) => {
  const { text } = req.body
  const todo = await Todo.create({ text, createdBy: req.user })
  res.json(todo)
})
// PUT /todos/:id -> update todo
router.put('/todos/:id', authMW, async (req, res) => {
  const { id } = req.params
  const { text } = req.body
  const updated = await Todo.findByIdAndUpdate(id, { text }, { new: true })
  res.json(updated)
})
// DELETE /todos/:id -> delete todo
router.delete('/todos/:id', authMW, async (req, res) => {
  const { id } = req.params
  const deleted = await Todo.findByIdAndDelete(id)
  res.json(deleted)
})

router.post('/upload', upload.single('profilePic'), (req, res) => {
  console.log(req.body)
  const location = '/api/files/' + req.file.filename
  res.json({ location })
})

export default router
