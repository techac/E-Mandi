// app/routes.js


var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
module.exports = function(app, passport, url, path) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		var isLoggedIn;
		if(req.isAuthenticated()){
			isLoggedIn = 1;
		}
		else{
			isLoggedIn = 0;
		}
		console.log(isLoggedIn);
		res.render('index.ejs',{authenticated:isLoggedIn}); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.set('view engine','ejs');
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



	//my routes


	app.get('/index.html',function(req,res){
		// console.log(isLoggedIn);
		res.render('index.ejs',{'req':req});
	});

  app.get('/cart.html',function(req,res){
		console.log('Hello');
		res.render('cart.ejs',{'title':'ejs'});
	});


	app.get('/wholeSellerListing',function(req,res){
		res.render('addListing.ejs',{'req':req});
	});

	app.post('/wholeSellerListing', isLoggedIn, function(req,res){
		console.log(req.user);
		connection.query("INSERT INTO Wholeseller (id , title, price, stock) VALUES (?,?,?,?) ", [req.user.id, req.body.title, req.body.price, req.body.stock],function(err, result){
			if(err) throw err;
			console.log("Entry Successsfully created");
		});
		res.send("Entry Successful");

	});

	app.get('*', function(req,res){
		var pathName = url.parse(req.url).pathname;
		console.log(pathName);
		res.sendFile(path.join(__dirname, '../views' + pathName));
	});


};



// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
