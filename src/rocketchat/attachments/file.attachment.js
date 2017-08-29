let webserverURL;

function fileAttachmentHandler(rc, msg) {
  let id = msg.file._id;
  let name = encodeURIComponent(msg.file.name);

  let token = rc.connection.webserverToken;

  let url = `${webserverURL}/file/${id}/${name}?t=${token}`;

  msg.msg += "\n";
  msg.msg += url;
}

module.exports = (rocketchat) => {
  webserverURL = rocketchat.server.webserver.publicURL;

  rocketchat.addAttachmentHandler("file", fileAttachmentHandler);
};