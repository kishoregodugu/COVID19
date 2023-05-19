const express = require("express");
const Path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = Path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001);
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStateDbObjectToResponse = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getState = `
    SELECT * FROM state;
    `;
  const getSta = await db.all(getState);
  response.send(
    getSta.map((eachState) => convertStateDbObjectToResponse(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateId = `
    SELECT * FROM state WHERE state_id=${stateId};
    `;
  const getID = await db.get(getStateId);
  response.send(convertStateDbObjectToResponse(getID));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDist = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  const postDis = await db.run(addDist);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDisID = `
    SELECT * FROM district WHERE district_id=${districtId};
    `;
  const getDis = await db.get(getDisID);
  response.send(convertDistrictDbObjectToResponseObject(getDis));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteId = `
    DELETE FROM district WHERE district_id=${districtId}; 
    `;
  await db.run(deleteId);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDis = `
    UPDATE district SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};
    `;
  await db.run(updateDis);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStat = `
    SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id=${stateId};
    `;
  const getTotal = await db.get(getStat);
  response.send(getTotal);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getIdSta = `
    SELECT state_name FROM state JOIN district ON state.state_id=district.state_id
    WHERE district_id=${districtId};
    `;
  const getStsID = await db.get(getIdSta);
  response.send(convertStateDbObjectToResponse(getStsID));
});

module.exports = app;
