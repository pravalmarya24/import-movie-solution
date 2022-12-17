let express = require("express");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "moviesData.db");

let db = null;

let initializeDBAndServer = async function () {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, function () {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log("DB Error: ${error.message}");
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Returns a list of all movie names in the movie table
app.get("/movies/", async function (request, response) {
  let getMoviesNameQuery = `
        SELECT movie_name
        FROM
        movie
    `;
  let moviesName = await db.all(getMoviesNameQuery);
  response.send(
    moviesName.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//Creates a new movie in the movie table
app.post("/movies/", async function (request, response) {
  let movieDetails = request.body;
  let { directorId, movieName, leadActor } = movieDetails;
  let postMovieQuery = `
            INSERT INTO
            movie (director_id, movie_name, lead_actor)
            VALUES (
                "${directorId}",
                "${movieName}",
                "${leadActor}",
            );`;
  await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID
app.get("/movies/:movieId/", async function (request, response) {
  let { movieId } = request.params;
  let getMovieById = `
            SELECT *
            FROM 
                movie
            WHERE
                movie_id = ${movieId};
    `;
  let movieById = await db.get(getMovieById);
  response.send(convertMovieDbObjectToResponseObject(movieById));
});

//Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async function (request, response) {
  let { movieId } = request.params;
  let putMoviesDetails = request.body;
  let { directorId, movieName, leadActor } = putMoviesDetails;
  let putMovieQuery = `
            UPDATE
              movie 
            SET 
              director_id= '${directorId}',
              movie_name= '${movieName}',
              lead_actor= '${leadActor}'
            WHERE
              movie_id = ${movieId};`;
  await db.run(putMovieQuery);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async function (request, response) {
  let { movieId } = request.params;
  let deleteMovieQuery = `
            DELETE 
            FROM
            movie
            WHERE
            movie_id= ${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//Returns a list of all directors in the director table
app.get("/directors/", async function (request, response) {
  let getDirectorQuery = `
        SELECT *
        FROM 
        director;
    `;
  let directorArray = await db.all(getDirectorQuery);
  response.send(
    directorArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

//Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async function (request, response) {
  let { directorId } = request.params;
  let getDirectedMovie = `
            SELECT movie_name
            FROM
            director
            NATURAL JOIN 
                movie
            WHERE
            director_id = ${directorId}
    `;
  let directedMoveArray = await db.all(getDirectedMovie);
  response.send(
    directedMoveArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
