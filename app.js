if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = []

const fs = require('fs')

app.set('view engine', 'pug')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


app.use('/static', express.static('public'))


app.get('/intro', checkNotAuthenticated, (req, res) => {
	res.render('intro')
})

app.get('/layout', (req, res) => {
	res.render('layout')
})

app.get('/login', checkNotAuthenticated, (req, res) => {
	res.render('login')
})



app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
	res.render('register')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})


app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

/// http://localhost:8000
app.get('/', (req, res) => {
  fs.readFile('./data/todos.json', (err, data) => {
    if (err) throw err

    const todos = JSON.parse(data)

    res.render('home', { todos: todos })
  })
})

app.post('/add', (req, res) => {
  const formData = req.body

  if (formData.todo.trim() == '') {
    fs.readFile('./data/todos.json', (err, data) => {
      if (err) throw err

      const todos = JSON.parse(data)

      res.render('/home', { error: true, todos: todos })
    })
  } else {
    fs.readFile('./data/todos.json', (err, data) => {
      if (err) throw err

      const todos = JSON.parse(data)

      const todo = {
        id: id(),
        description: formData.todo,
        done: false
      }

      todos.push(todo)

      fs.writeFile('./data/todos.json', JSON.stringify(todos), (err) => {
        if (err) throw err

        fs.readFile('./data/todos.json', (err, data) => {
          if (err) throw err

          const todos = JSON.parse(data)

          res.render('home', { success: true, todos: todos })
        })
      })
    })
  }
})

app.get('/:id/delete', (req, res) => {
  const id = req.params.id

  fs.readFile('./data/todos.json', (err, data) => {
    if (err) throw err

    const todos = JSON.parse(data)

    const filteredTodos = todos.filter(todo => todo.id != id)

    fs.writeFile('./data/todos.json', JSON.stringify(filteredTodos), (err) => {
      if (err) throw err

      res.render('home', { todos: filteredTodos, deleted: true })
    })
  })
})


app.get('/:id/update', (req, res) => {
  const id = req.params.id

  fs.readFile('./data/todos.json', (err, data) => {
    if (err) throw err
    
    const todos = JSON.parse(data)
    const todo = todos.filter(todo => todo.id == id)[0]
    
    const todoIdx = todos.indexOf(todo)
    const splicedTodo = todos.splice(todoIdx, 1)[0]
    
    splicedTodo.done = true
    
    todos.push(splicedTodo)

    fs.writeFile('./data/todos.json', JSON.stringify(todos), (err) => {
      if (err) throw err

      res.render('home', { todos: todos })
    })
  })
    
})


app.listen(8000, err => {
	if(err) throw err

	console.log('App is running on port 8000...')
})

function id () {
  return '_' + Math.random().toString(36).substr(2, 9);
}