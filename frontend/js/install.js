function Install(){
  if(document.getElementById("password1").value == document.getElementById("password2").value){
    var request = {hash:"",salt:"",iter:0,test:"",key:""};
    if(document.getElementById("passphrase1").value == document.getElementById("passphrase2").value){
      //Import libraries
      var pbkdf2 = require('pbkdf2-sha256');

      //Create key from passphrase
      var passphrase = document.getElementById("passphrase1").value;
      var salt = CryptoJS.lib.WordArray.random(128/8);
      salt = salt.toString();
      var iter =  Math.floor(Math.random() * (60000 - 45000 + 1)) + 45000;
      var pbkhash = pbkdf2(passphrase, salt, iter, 32);
      pbkhash = pbkhash.toString('hex');
      var privatekey = CryptoJS.lib.WordArray.random(32).toString();
      var encryptedtest = CryptoJS.AES.encrypt("test", privatekey);
      privatekey = CryptoJS.AES.encrypt(privatekey, pbkhash);
      //Prepare request
      request.salt = salt;
      request.iter = iter;
      request.hash = sha256(document.getElementById("password1").value);
      request.key = privatekey.toString();
      request.test = encryptedtest.toString();

      //Send request
      var output = SendJson(request,"/config/setup");

      document.getElementById("status").innerHTML = "Success!";

      //Redirect to login page
      window.location = "/app/login.html";
      }else{
        document.getElementById("status").innerHTML = "Passphrases don't match";
      }
  }else{
    document.getElementById("status").innerHTML = "Passwords don't match";
  }
}

function SendJson(object,url) {
  var xhttp = new XMLHttpRequest()
  xhttp.open("POST", url, false);
  xhttp.send(JSON.stringify(object));
  return [xhttp.status, xhttp.responseText];
}

function Fetch(url) {
  var xhttp = new XMLHttpRequest()
  xhttp.open("GET", url, false);
  xhttp.send(null);
  return xhttp.responseText;
}

var button = document.getElementById('install');
button.addEventListener('click', Install);
