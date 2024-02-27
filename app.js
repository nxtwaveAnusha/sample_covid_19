const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null
const intializeDBAndSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
intializeDBAndSever()

const convertDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    population: dbObject.population,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getstatesQuery = `
     SELECT * FROM state;`

  const statesArray = await db.all(getstatesQuery)
  response.send(statesArray.map(each => convertDbObjectToResponseObject(each)))
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getstateQuery = `
     SELECT * FROM state WHERE state_id = ${stateId};`

  const stateArray = await db.get(getstateQuery)
  response.send(convertDbObjectToResponseObject(stateArray))
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const addDistrictQuery = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`

  await db.run(addDistrictQuery)

  response.send('District Successfully Added')
})

app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `
     SELECT * FROM district WHERE district_id = ${districtId};`

  const districtArray = await db.get(getdistrictQuery)
  response.send(convertDbObjectToResponseObject(districtArray))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const updatedistrictQuery = `UPDATE district SET district_name='${districtName}',state_id= ${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id = ${districtId};`
  await db.run(updatedistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const totalQuery = `SELECT SUM(cases) as totalCases,SUM(cured) as totalCured,SUM(active) as totalActive,SUM(deaths) as totalDeaths FROM district WHERE state_id = ${stateId};`
  const totalObj = await db.get(totalQuery)
  response.send(totalObj)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params

  const stateNameQuery = `SELECT state.state_name FROM state INNER JOIN district ON state.state_id = district.state_id WHERE district_id = ${districtId};`
  const snameObj = await db.get(stateNameQuery)
  response.send(convertDbObjectToResponseObject(snameObj))
})
module.exports = app
