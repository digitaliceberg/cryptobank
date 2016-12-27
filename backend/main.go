package main

import (
	"log"
	"fmt"
	"io/ioutil"
	"encoding/json"
	"os"
	"net/http"
	"time"
	"io"
	"github.com/gorilla/mux"
	"github.com/dgrijalva/jwt-go"
)

//Data structures

type mainconfig struct{
	Hash string `json:"hash"`
	Key string `json:"key"`
	Metadata string `json:"metadata"`//Encrypted metadata blob
	Test string `json:"test"`
	Salt string `json:"salt"` 
	Iter int `json:"iter"`
}

type SetupRequest struct {
	Hash string `json:"hash"` //Password hash SHA-256
	Salt string `json:"salt"` //Salt for PBKDF2
	Key string `json:"key"` //Encrypted private key
	Test string `json:"test"` //Encrypted string "test" to check if key was properly decrypted
	Iter int `json:"iter"` //Iterations of PBKDF2 hash
}

type LoginRequest struct {
	Hash string `json:"hash"` //SHA-256 of password to authenticate
}

type LoginResponse struct{
	Jwt string `json:"token"` //JWT Token
	Expires int `json:"expires"` //Timestamp of token expiry
	Salt string `json:"salt"` 
	Iter int `json:"iter"` 
	Key string `json:"key"` //Encrypted blob containing privatekey
	Test string `json:"test"`
}

var privatekey = []byte("ENTER A PRIVATEKEY HERE MAKE SURE IT'S LONG")

func main() {
    router := mux.NewRouter().StrictSlash(true)
    router.HandleFunc("/", Index)
	router.HandleFunc("/config/setup", Setup)
	router.HandleFunc("/auth/login", Auth)
	router.HandleFunc("/storage/create", FileUpload)
	router.PathPrefix("/app/").Handler(http.StripPrefix("/app/", http.FileServer(http.Dir("content"))))
    log.Fatal(http.ListenAndServe(":8080", router))
}

//Logic functions

func StoreBlob(filename string, blob io.ReadCloser) {
   fo, err := os.Create(filename+".dat")
   if err != nil {
       panic(err)
   }
   defer func() {
       if err := fo.Close(); err != nil {
           panic(err)
       }
   }()
	cnt, err := io.Copy(fo, blob)
	fmt.Printf("%d bytes written", cnt)
	if err != nil {
	fmt.Printf("Error writing to disk")
	}
}

func IsInstalled() bool{
	var installed bool
	if _, err := os.Stat("config.json"); os.IsNotExist(err) {
		installed = false
		}else{
		installed = true
	}
	return installed
}

func GetConfig() mainconfig{
	var conf mainconfig
	dat, err := ioutil.ReadFile("config.json")
	 if err != nil{
		 fmt.Println("Missing config.json file")
	 }else{
		 json.Unmarshal([]byte(dat), &conf)
	 }
	 return conf
 }
 
 func NewToken() (string, int){
 	expire := time.Now().Add(time.Hour*2).Unix()
 	token := jwt.New(jwt.SigningMethodHS256)// Create the token
 	token.Claims["exp"] = expire
 	tokenString, _ := token.SignedString(privatekey)// Sign and get the complete encoded token as a string
 	return tokenString, int(expire)
 }
 
 func ValidToken(r *http.Request) (bool){ 
 	var status bool
 	if(r.Header.Get("Authorization") == ""){
 		status = false
 	}else{
 		var myToken string = r.Header.Get("Authorization")
 		token, err := jwt.Parse(myToken, func(token *jwt.Token) (interface{}, error) {
 			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
 				return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
 			}
 			return privatekey, nil
 		})

 		if err == nil && token.Valid {
 			status = true
 		} else {
 			status = false
 		}
 	}
     return status
 }
 
 func CreateConfig(hash string, salt string, privatekey string, test string, iter int) string{
	var result string
	var conf mainconfig
	conf.Key = privatekey
	conf.Salt = salt
	conf.Iter = iter
	conf.Hash = hash
	conf.Test = test
	jsonbody, err := json.Marshal(conf)
	if err != nil {
			fmt.Println(err)
	}
	contents := []byte(string(jsonbody))
	if _, err := os.Stat("config.json"); os.IsNotExist(err) {
		err = ioutil.WriteFile("config.json", contents, 0644)
			if err != nil{
				panic(err)
			}else{
					result = "Config file creation complete."
			}
	  }else{
		result = "Config file already exists"
	}
	return result
}

 //Request handlers
 
 func Index(w http.ResponseWriter, r *http.Request) {
		if(IsInstalled()){
			http.Redirect(w, r, "/app/login.html", 302)
		}else{
			http.Redirect(w, r, "/app/install.html", 302)
		}
}

 func Setup(w http.ResponseWriter, r *http.Request) {
	var conf SetupRequest
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&conf)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Invalid request")
	}else{
		CreateConfig(conf.Hash, conf.Salt, conf.Key, conf.Test, conf.Iter)
		fmt.Fprintln(w, "Complete!")
		 }
	}
	
 func Auth(w http.ResponseWriter, r *http.Request) {
	    var response LoginResponse
		var request LoginRequest
		dec := json.NewDecoder(r.Body)
		dec.Decode(&request)
		conf := GetConfig();
		if(request.Hash == conf.Hash){
			token, expires := NewToken()
			response.Jwt = token;
			response.Expires = expires;
			response.Key = conf.Key
			response.Test = conf.Test
			response.Salt = conf.Salt
			response.Iter = conf.Iter
			jsonbody, err := json.Marshal(response)
				if err != nil{
					fmt.Println("Error parsing")
				}
				fmt.Println("Password correct sending:",string(jsonbody))
				fmt.Fprintln(w, string(jsonbody))
				}else{
					w.WriteHeader(http.StatusBadRequest)
					fmt.Fprintln(w, "Password incorrect")
				}
		}
 
  func FileUpload(w http.ResponseWriter, r *http.Request) {
		//if(ValidToken(r)){	
			StoreBlob(r.URL.Query().Get("id"),  r.Body)
			fmt.Fprintln(w, "File upload complete")
		//}else{
		//	w.WriteHeader(http.StatusBadRequest)
		//	fmt.Fprintln(w, "Invalid Token")
		//}
}

/*

File structure of webserver
/data for raw data
config.json for metadata

Structure of links
JWT auth /metadata/edit <--- AES encrypted blob in file called metadata.dat
JWT auth /storage/delete <--- Post JSON request with file to be deleted(Reference)
JWT auth /storage/create <---- Post request with body to be stored
JWT auth /storage/fetch <--- JSON request with filename and body

File upload
referenceid string
body encrypted string

Algo
Get request check if JWT valid create file with referenceid.dat then store encrypted string in it

Refresh button on dashboard refreshes metadata
Directory support for file uploads needed
*/
