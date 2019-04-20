// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    connection.query("CREATE TABLE IF NOT EXISTS Cart ( \
        `id` INT UNSIGNED NOT NULL, \
        `title` VARCHAR(255) NOT NULL, \
        `price` INT NOT NULL, \
        `quantity` INT NOT NULL, \
        `sellerID` INT UNSIGNED NOT NULL, \
        FOREIGN KEY (id) REFERENCES users(id), \
        FOREIGN KEY (sellerID) REFERENCES users(id)\
    ) ", function(err,result){
        if(err) throw err;
        console.log("Cart database created");
    });


    connection.query('\
    CREATE TABLE IF NOT EXISTS`' + dbconfig.database + '`.`' + dbconfig.users_table + '` ( \
        `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
        `username` VARCHAR(20) NOT NULL, \
        `password` CHAR(60) NOT NULL, \
        `role` CHAR(60) NOT NULL,\
        `state` CHAR(60) NOT NULL,\
            PRIMARY KEY (`id`), \
        UNIQUE INDEX `id_UNIQUE` (`id` ASC), \
        UNIQUE INDEX `username_UNIQUE` (`username` ASC) \
    )',function(err, result){
        if(err) throw err;
        console.log("Users Table created Succesfully");
    });
    connection.query("CREATE TABLE IF NOT EXISTS Wholeseller ( \
        `id` INT UNSIGNED NOT NULL,\
        `title` VARCHAR(255) NOT NULL,\
        `price` INT,\
        `stock` INT,\
        FOREIGN KEY (id) REFERENCES users(id)\
    ) ", function(err,result){
        if(err) throw err;
        console.log("Wholeseller database created");
    });
    connection.query("CREATE TABLE IF NOT EXISTS Retailer ( \
        `id` INT UNSIGNED NOT NULL,\
        `title` VARCHAR(255) NOT NULL,\
        `price` INT,\
        `stock` INT,\
        FOREIGN KEY (id) REFERENCES users(id)\
    ) ", function(err,result){
        if(err) throw err;
        console.log("Retailer database created");
    });
    connection.query("CREATE TABLE IF NOT EXISTS Farmer( \
        `id` INT UNSIGNED NOT NULL,\
        `title` VARCHAR(255) NOT NULL,\
        `price` INT,\
        `stock` INT,\
        FOREIGN KEY (id) REFERENCES users(id)\
    ) ", function(err,result){
        if(err) throw err;
        console.log("Farmer database created");
    });
    // `img` blob ,\
    // `file_name` varchar(45) collate latin1_general_ci ,\
    

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = {
                        username: username,
                        password: bcrypt.hashSync(password, null, null),
                        role : req.body.role,
                        state: req.body.state,
                          // use the generateHash function in our user model
                    };

                    var insertQuery = "INSERT INTO users ( username, password,role,state ) values (?,?,?,?)";

                    connection.query(insertQuery,[newUserMysql.username, newUserMysql.password, newUserMysql.role, newUserMysql.state],function(err, rows) {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );
};
