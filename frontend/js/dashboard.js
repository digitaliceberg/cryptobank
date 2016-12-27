					//First time using JS, sorry for ugly code :(
					var masterkey = localStorage.getItem("privatekey");
					var fullbody = document.getElementById('drop_zone');
					var filecount = 0;
					var currentfile = "";

					var button = document.getElementById('logout_btn');
					button.addEventListener('click', Logout);

					String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

					fullbody.ondragover = function(ev) {
					 ev.preventDefault();
					 fullbody.setAttribute("style", "border-style: dashed;border-width: 5px;border-color: #2980b9;");
					}

					fullbody.ondragleave = function(ev) {
					 ev.preventDefault();
					 fullbody.setAttribute("style", "");
					}

					fullbody.ondrop = function(ev) {
					 ev.preventDefault();
					 fullbody.setAttribute("style", "");
					}

					function handleDragOver(evt) {
						evt.stopPropagation();
						evt.preventDefault();
						evt.dataTransfer.dropEffect = 'copy';
					}

					var dropZone = document.getElementById('drop_zone');
					dropZone.addEventListener('dragover', handleDragOver, false);
					dropZone.addEventListener('drop', handleFileSelect, false);

					function humanFileSize(bytes, si) {
					    var thresh = si ? 1000 : 1024;
					    if(Math.abs(bytes) < thresh) {
					        return bytes + ' B';
					    }
					    var units = si
					        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
					        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
					    var u = -1;
					    do {
					        bytes /= thresh;
					        ++u;
					    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
					    return bytes.toFixed(1)+' '+units[u];
					}

					  function handleFileSelect(evt) {
					    evt.stopPropagation();
					    evt.preventDefault();

					    var files = evt.dataTransfer.files;

					    var output = [];
					    for (var i = 0, f; f = files[i]; i++) {
								var identifier = f.name.replace(".","");
								currentfile = f.name;
								AddRow(f.name,f.type,humanFileSize(f.size),f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',identifier);
							  fileUpload(f);
					    }
					    //document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
					  }

						function GetFileIcon(filetype){
							var fileicon;
							if(filetype == "application/zip"){
								fileicon = "fa fa-archive";
							}else if(filetype.contains("image/")){
								fileicon = "fa fa-picture-o";
							}else if(filetype.contains("video/")){
									fileicon = "fa fa-film";
							}else if(filetype.contains("audio/")){
								fileicon = "fa fa-music";
							}else if(filetype.contains("text/")){
								fileicon = "fa fa-code"
							}else if(filetype.contains('java')){
								fileicon = "fa fa-coffee"
							}else{
								fileicon = "fa fa-file";
							}
							return fileicon;
						}

						function AddRow(filename,filetype,filesize,filedate,identifier){
							  var fileicon = GetFileIcon(filetype);
								var onclick = [];
								onclick.push(
								  'onclick="',
								  "$('#",
									identifier,
								  "').modal('show')",
									'"'
								);
								var active = "";
								if((filecount+1) % 2 == 1) {
									active = 'class="active"';
								}
								var modal = '<div id="'+identifier+'" class="modal fade" tabindex="-1" role="dialog"><div class="modal-dialog modal-sm"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>'
																				+'<h4 class="modal-title"><i class="fa fa-cog"></i> '+filename+'</h4></div><div class="modal-body"><a href="#"><i class="fa fa-download"></i> Download</a><br><a href="#"><i class="fa fa-pencil"></i> Rename</a><br><a href="#"><i class="fa fa-ban"></i> Delete</a></div></div></div>';
								var row = '<tr '+active+' '+onclick.join("")+'>'+modal+'<td><i class="'+fileicon+'"></i> '+filename+'</td><td>'+filedate+'</td><td>'+filesize+'</td></tr>';
								document.getElementById('table-body').innerHTML += row;
								filecount++;
						}

						function Encrypt(plaintext){
							var ciphertext = CryptoJS.AES.encrypt(plaintext, masterkey);
							return ciphertext;
						}
						function Decrypt(ciphertext){
							var plaintext = CryptoJS.AES.decrypt(ciphertext, masterkey).toString(CryptoJS.enc.Latin1)
							return plaintext;
						}

						function DisplayUploadProgress(percentage){
							document.getElementById('file_status').innerHTML = '<div class="alert alert-info" role="alert"><h3>Uploading '+currentfile+' - '+percentage+'%</h3><div class="progress progress-striped active progress-left"><div class="bar blue" style="width:'+percentage+'%;"></div></div></div>';
						}

						function updateProgress (oEvent) {
						  if (oEvent.lengthComputable) {
						    var percentComplete = Math.round(oEvent.loaded / oEvent.total * 100);
						    DisplayUploadProgress(percentComplete);
						  }
						}

						function transferComplete(){
							document.getElementById('file_status').innerHTML = '<div class="alert alert-success" role="alert"><h3>Upload complete for '+currentfile+'</h3><div class="progress progress-striped active progress-left"><div class="bar green" style="width:100%;"></div></div></div>';
						}

						function transferFailed(){
						document.getElementById('file_status').innerHTML = '<div class="alert alert-danger" role="alert"><h3>Upload failed, an error occured</h3><div class="progress progress-striped disabled progress-left"><div class="bar red" style="width:100%;"></div></div></div>';
						}

						function transferCanceled(){
								document.getElementById('file_status').innerHTML = '';
						}

						function fileUpload(f){
							currentfile = f.name;
							var xhttp = new XMLHttpRequest();
							xhttp.upload.addEventListener("progress",  updateProgress, false);
							xhttp.addEventListener("load", transferComplete, false);
							xhttp.addEventListener("error", transferFailed, false);
							xhttp.addEventListener("abort", transferCanceled, false);
							xhttp.open("POST", "/storage/create?id=" + CryptoJS.lib.WordArray.random(64).toString());
							var reader = new FileReader();
							reader.onload = function(){
								xhttp.send(Encrypt(reader.result));
							}
							reader.readAsDataURL(f);
						}

						function Logout(){
							localStorage.clear();
							window.location = "/app/login.html";
						}

						function dataURItoBlob(dataURI) {
						    var byteString;
						    if (dataURI.split(',')[0].indexOf('base64') >= 0)
						        byteString = atob(dataURI.split(',')[1]);
						    else
						        byteString = unescape(dataURI.split(',')[1]);
						    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
						    var ia = new Uint8Array(byteString.length);
						    for (var i = 0; i < byteString.length; i++) {
						        ia[i] = byteString.charCodeAt(i);
						    }

						    return new Blob([ia], {type:mimeString});
						}
/*Meta data algo

Login add metadata to localstorage when on dashboard decrypt & parse metadata into rows

add to metadata and update config then rows

Folder support to be added

Ignore file uploads and give modal to tell them you're already uploading something

Add view command for images and text files below 100MB


On click view file if it's the correct format
Add a stop button for file uploads and download

File already exists
<div id="file_status" class="alert alert-danger" role="alert">
	<h3>A file with the same name already exists</h3>
</div>

When upload complete add OK button to close alert

Solution for my file upload code: https://stackoverflow.com/questions/16690740/how-to-show-loading-status-in-percentage-for-ajax-response

JSON.stringify(object)

File upload

Log out session when JWT expires automatically strigger event on file upload and click
If expires not valid trigger Logout()
*/
