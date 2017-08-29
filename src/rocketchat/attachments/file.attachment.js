let webserverURL;

function fileAttachmentHandler(rc, msg, attachment) {
  let id = msg.file._id;
  let name = encodeURIComponent(msg.file.name);
  let title = attachment.title;
  let description = attachment.description;

  let token = rc.connection.webserverToken;

  let url = `${webserverURL}/file/${id}/${name}?t=${token}`;

  if (title) {
    msg.msg += "\n" + title.irc.bold().underline();
  }

  msg.msg += "\n" + url;

  if (description) {
    msg.msg += "\n" + description.irc.italic();
  }
}

module.exports = (rocketchat) => {
  webserverURL = rocketchat.server.webserver.publicURL;

  rocketchat.addAttachmentHandler("file", fileAttachmentHandler);
};