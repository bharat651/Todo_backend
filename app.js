const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const {parse, format, isValid} = require('date-fns')
app.use(express.json())

//intialize DB connection
let db = null
const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`SERVER RUNNING AT 3000 PORT....`)
    })
  } catch (error) {
    console.log(`dbIntializer Fail : Error ${error.message}`)
  }
}

//MIDILEWARE check
const midilWareFun = (request, response, next) => {
  const {search_q = '', priority, status, category} = request.query
  const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
  const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
  const categoryArray = ['WORK', 'HOME', 'LEARNING']

  let sqlQuery = ''
  if (priority !== undefined) {
    if (priorityArray.includes(priority)) {
      // console.log('It include')
      sqlQuery += ` AND priority ='${priority}'`
    } else {
      return response.status(400).send('Invalid Todo Priority')
    }
  }
  if (status !== undefined) {
    if (statusArray.includes(status)) {
      sqlQuery += ` AND status = '${status}'`
    } else {
      return response.status(400).send('Invalid Todo Status')
    }
  }
  if (category !== undefined) {
    if (categoryArray.includes(category)) {
      sqlQuery += ` AND category = '${category}'`
    } else {
      return response.status(400).send('Invalid Todo Category')
    }
  }
  request.customQuery = sqlQuery + `;`
  next()
}

//API 1
app.get('/todos/', midilWareFun, async (request, response) => {
  const {search_q = '', priority, status, category} = request.query
  const sqlQuery = request.customQuery
  const query = `SELECT id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'`
  const result = await db.all(query + sqlQuery)
  response.send(result)
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getById = `SELECT id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE id = ${todoId};`
  const result = await db.get(getById)
  response.send(result)
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const parseDate = parse(date, 'yyyy-MM-dd', new Date())
  // console.log(isValid(parseDate))
  if (!isValid(parseDate)) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    console.log(date)
    const formatedDate = format(parseDate, 'yyyy-MM-dd')
    const getByDate = `SELECT id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE due_date = '${formatedDate}';`
    const result = await db.all(getByDate)
    response.send(result)
  }
})

//API 4
app.post('/todos', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const sqlQuery = `INSERT INTO todo VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(sqlQuery)
  response.send('Todo Successfully Added')
})

//API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status, priority, todo, category, dueDate} = request.body

  let columnName = ''
  let columnValue = ''
  let updateResponseText
  switch (true) {
    case status !== undefined:
      columnName = 'status'
      columnValue = status
      updateResponseText = 'Status Updated'
      break
    case priority !== undefined:
      columnName = 'priority'
      columnValue = priority
      updateResponseText = 'Priority Updated'
      break
    case todo !== undefined:
      columnName = 'todo'
      columnValue = todo
      updateResponseText = 'Todo Updated'
      break
    case category !== undefined:
      columnName = 'category'
      columnValue = category
      updateResponseText = 'Category Updated'
      break
    case dueDate !== undefined:
      columnName = 'due_date'
      columnValue = dueDate
      updateResponseText = 'Due Date Updated'
      break
  }
  const sqlQuery = `UPDATE todo SET ${columnName} = '${columnValue}' WHERE id = ${todoId};`
  console.log(status)
  await db.run(sqlQuery)
  response.send(updateResponseText)
})

//API 6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const sqlQuery = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(sqlQuery)
  response.send('Todo Deleted')
})

dbConnection()

module.exports = app
