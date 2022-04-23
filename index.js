const express = require("express");
const mysql = require('mysql');
const session = require('express-session');
const fetch = require('node-fetch');

const app = express();
const pool = dbConnection();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const url = `https://www.omdbapi.com/?apikey=8de07ea1&i=`;

const fetchUrl = async(url) => {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}


//routes

// the movie list
app.get('/', async(req, res) => {
  let sql = `SELECT movieId 
             FROM proj_movies`;

  let rows = await executeSQL(sql);
  let id = [];
  for(let i = 0; i < rows.length; i++) {
    id.push(rows[i].movieId);
  }

  let movieData = [];
  for (let i = 0; i < id.length; i++) {
    movieData.push(await fetchUrl(url+id[i]));
  }

  data = {
    'title': 'Movie List',
    'authenticated': req.session.authenticated,
    'username': req.session.username,
    'movieData' : movieData
  };
  res.render('movieList', data);
});

// movie page (consists of a comment button)
app.get('/movie', async(req, res) => {
  let id = req.query.id;

  let info = await fetchUrl(url+id);

  let sql = `SELECT *
             FROM proj_comments
             WHERE movieId = ?`;

  let comments = await executeSQL(sql, [id]);

  data = {
    'title': 'Movie List',
    'authenticated': req.session.authenticated,
    'username': req.session.username,
    'id' : id,
    'info': info,
    'comments': comments
  };

  res.render('moviePage', data);
});

// add comment
app.post('/comment/new', async(req, res) => {
  if(req.session.authenticated != true) {
    res.redirect('/login');
    return;
  }
  let username = req.body.username;
  let movieId = req.body.movieId;
  let worthWatching = req.body.worthWatching;
  let rating = req.body.rating;
  let text = req.body.comment;

  let params = [username, movieId, worthWatching, rating, text];
  
  let sql = `INSERT INTO 
             proj_comments (username, movieId, worthWatching, rating, text)
             VALUES (?,?,?,?,?)`;
  let rows = await executeSQL(sql, params);

  res.redirect(`/movie?id=${movieId}`);
}); 

// edit comment
app.get('/comment/edit', async(req, res) => {
  let commentId = req.query.commentId;

  let sql = `SELECT *
             FROM proj_comments
             WHERE commentId = ?`;
  let result = await executeSQL(sql, [commentId]);

  if(result.length <= 0) {
    res.send('Comment doesn\'t exist');
    return;
  }

  if(result[0].username != req.session.username) {
    res.redirect('/login');
    return;
  }
  
  data = {
    'title': 'Edit Comment',
    'authenticated': req.session.authenticated,
    'username': req.session.username,
    'comment': result[0]
  }
  res.render('comment', data);
});

app.post('/comment/edit', async(req, res) => {
  let username = req.body.username;
  let commentId = req.body.commentId;
  let worthWatchng = req.body.worthWatching;
  let rating = req.body.rating;
  let text = req.body.comment;

  if(username != req.session.username) {
    res.redirect('/login');
    return;
  }

  let params = [text, rating, worthWatchng];

  let sql = `UPDATE proj_comments
             SET text = ?,
             rating = ?,
             worthWatching = ?
             WHERE commentId = ${commentId} and username = '${req.session.username}'`;
  let rows = await executeSQL(sql, params);

  sql = `SELECT *
             FROM proj_comments
             WHERE commentId = ?`;
  result = await executeSQL(sql, [commentId]);

  if(result.length <= 0) {
    res.send('Comment doesn\'t exist');
    return;
  }

  data = {
    'title': 'Edit Comment',
    'authenticated': req.session.authenticated,
    'username': req.session.username,
    'comment': result[0],
    'message': 'Comment Updated Successfully'
  };

  res.render('comment', data);
});

// sign in
app.get('/login', (req, res) => {
  req.session.authenticated = false;

  data = {
    'title': 'Login'
  }
  res.render('login', data);
});

app.post('/login', async(req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if(username.length<=0 || password.length<=0) {
    res.redirect('/login');
    return;
  }

  let passwordDb = "";

  let sql = `SELECT *
             FROM proj_users
             WHERE username = ?`;
  let result = await executeSQL(sql, [username]);

  if(result.length > 0) {
    passwordDb = result[0].password;
  } else {
    res.render('login', {'title':'Login', 'error': 'Invalid Credentials'});
    return;
  }
  
  if(passwordDb == password) {
    req.session.authenticated = true;
    req.session.username = username;
    res.redirect('/');
  } else {
    res.render('login', {'title':'Login', 'error': 'Invalid Credentials'});
  }
});

// sign up
app.get('/register', async(req, res) => {
  res.render('signup', {'title':'Sign Up'});
});

app.post('/register', async(req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let repeatPassword = req.body.repPassword;

  let sql = `SELECT username
             FROM proj_users
             where username = ?`;
  
  let rows = await executeSQL(sql, [username]);

  if(rows.length > 0) {
    res.render('signup', {'title':'Sign Up', 'error':'Username unavailable'});
    return;
  } 
  
  if(password != repeatPassword) {
    res.render('signup', {'title':'Sign Up', 'error':'Passwords do not match'});
    return;
  }

  sql = `INSERT INTO
         proj_users(username, password)
         VALUES(?, ?)`;
  rows = await executeSQL(sql, [username, password]);

  res.redirect('/login');

});

// logout
app.get('/logout', async(req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// comment
app.get('/comment', async(req, res) => {
  res.render('comment', {'title':'Comment'});
});

app.get("/dbTest", async function(req, res) {
  let sql = "SELECT CURDATE()";
  let rows = await executeSQL(sql);
  res.send(rows);
});//dbTest

//functions
async function executeSQL(sql, params) {
  return new Promise(function(resolve, reject) {
    pool.query(sql, params, function(err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}//executeSQL
//values in red must be updated
function dbConnection() {

  const pool = mysql.createPool({

    connectionLimit: 10,
    host: "grp6m5lz95d9exiz.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "omhbp2zqhmwl88y6",
    password: "a7m9pp5g932rvavs",
    database: "bdt1z3wls40j65ls"

  });

  return pool;

} //dbConnection

//start server
app.listen(3000, () => {
  console.log("Expresss server running...")
})