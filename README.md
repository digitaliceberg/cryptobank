# CryptoBank | Incomplete Self hosted encrypted file storage

The idea behind CryptoBank was to have encrypted personal file storage where metadata and data is encrypted.  
I started this project but abandoned it after getting caught up in other projects, so I'm releasing the source code for anyone who wants to see how it worked or if they want to continue it.  
I believe MEGA.co.nz works similarly so if you want secure file storage, you can get it there.  

![Alt text](https://i.imgur.com/CFD6sEP.png?raw=true "Install")

### Algorithm
If you want to continue this project or use any code here's how the complete project should work.  
Register, get a PBKDF2 hash from users information, use that to generate a private key for AES-256  
Any uploads are encrypted with AES-256 and assigned a random ID, that ID is assigned to it's original metadata which is encrypted in a blob  
When a download occurs, load encrypted blob into memory then decrypt with the PBKDF-2 key with AES-256  

### Project Files

* `frontend`: Mostly just HTML, CSS and some JS done(Authentication, Installation), not complete.
* `backend`: Contains all golang REST API source code, only things in place are authentication, installation and reading of config.

### Security
 Since we're using PBKDF-2 it's impossible to decrypt the users information without the original password, the random interations and other information in place compeltely cuts out the vulnerability of a server being compromised.
 This service works similar to how ProtonMail encrypts their users information.

### To Do
* File uploads: Encrypt data and assign random ID, store locally, encrypt the metadata and assign that to the ID of the file
* Send metadata of files with their assigned random IDs encrypted in AES-256 to be decrypted client side with the PBKDF-2 with AES-256.
* File downloads: download encrypted blob into memory then decrypt with the PBKDF-2 key with AES-256
