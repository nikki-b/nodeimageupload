// app requirements
var path = require("path");
var express = require("express");
var formidable = require('formidable');
var util = require('util');
var fs = require('fs-extra');
var qt = require('quickthumb');

// declare express app
var app = express();

// database setup
var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost/img_uploads');

// user model
var UserSchema = new mongoose.Schema({
	name: String,
	age: Number,
  photo: String
});
var User = mongoose.model("User", UserSchema);

// quickthumb for static content
app.use(qt.static(__dirname + '/'));

// set the views folder and set up ejs
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// root route
app.get('/', function(req, res) {
 // This is where we would get the users from the database and send them to the index view to be displayed.
 User.find({}, function(err, users){
 	if(err){
 		console.log("nothing here");
 		res.render('index');
 	}
 	else{
	 res.render('index', {users: users});
 	}
 })
})

// route to add a user
app.post('/users', function(req, res) {
  // create form object from post
  var form = new formidable.IncomingForm();

  // parse a file upload
  form.parse(req, function(err, fields, files){
    console.log("parsed!");
  });

  // create user object
  var user = new User();

  function randomString(){
    var characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        charLength = characters.length;
        randomString = "";
        length = 14;

    for (var i = 0; i < length; i++){
      var index = Math.floor(Math.random() * charLength);
      randomString += characters[index];  
    }
    return randomString;
  }

  form.on('field', function(key, value){
    user[""+key+""] = value;
  });

  form.on('file', function(name, file){
    // temporary location of uploaded files
    console.log(file);
    var temp_path = file.path;
    // the file name of the uploaded file
    var og_name = file.name;
    var extension = og_name.split('.').pop();
    var file_name = randomString() + "." + extension;
    console.log(file_name);
    // location where we want to copy the uploaded file
    // in a file for the individual user, in case we want to allow them to edit or add more later
    var new_location = "uploads/" + user._id + "/";
    user.photo = new_location + file_name;

    fs.copy(temp_path, new_location + file_name, function(err){
      if(err){
        console.log(err);
      }
      else{
        // try to save that new user to the database (this is the method that actually inserts into the db) and run a callback function with an error (if any) from the operation.
        user.save(function(err) {
          console.log("save");
          // if there is an error console.log that something went wrong!
          if(err) {
            console.log('something went wrong');
          } else { // else console.log that we did well and then redirect to the root route
            console.log('successfully added a user!');
          }
          res.redirect("/");
        });
      }
    });
  });
});

// listen on 8000
app.listen(8000, function() {
 console.log("listening on port 8000");
});