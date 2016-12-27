function Login(){
  //Login
  var password = sha256(document.getElementById("password").value);
  var passphrase = document.getElementById("passphrase").value;
  var sent_password = {hash:password};
  var output = SendJson(sent_password, "/auth/login");
  //Parse response
  if(output[0] == 200){
    var profile = JSON.parse(output[1]);
    localStorage.setItem("token", profile.token);
    localStorage.setItem("token_expire", profile.expires);
    //Generate key from passphrase
		var pbkdf2 = require('pbkdf2-sha256');
    var pbkhash = pbkdf2(passphrase,  profile.salt, profile.iter, 32);
    pbkhash = pbkhash.toString('hex');
    //Check validity of passphrase
    var privatekey = CryptoJS.AES.decrypt(profile.key, pbkhash).toString(CryptoJS.enc.Latin1);
    var test = CryptoJS.AES.decrypt(profile.test, privatekey).toString(CryptoJS.enc.Latin1);
      if(test == "test"){
        localStorage.setItem("privatekey", privatekey);
        localStorage.setItem("token", profile.token);
        localStorage.setItem("expires", profile.expires);
        document.getElementById("status").innerHTML = "Success!";
        window.location = "/app/dashboard.html";
      }else{
          document.getElementById("status").innerHTML = "Incorrect Passphrase";
      }
  }else{
    document.getElementById("status").innerHTML = "Incorrect Password";
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

var button = document.getElementById('login');
button.addEventListener('click', Login);
