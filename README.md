# rocketchat-irc-gateway

An IRC gateway for rocket.chat.

# Installation

```
git clone https://github.com/Lemmmy/rocketchat-irc-gateway
cd rocketchat-irc-gateway
npm i
gulp build
node main
```

# Usage

```
ROCKETCHAT_HOST=demo.rocket.chat
SERVER_HOST=irc.demo.rocket.chat
```

The environment variables are also read from a `.env` file.

Connect to `irc.demo.rocket.chat:6667` with the nick set to your rocketchat username, and the password set to your rocketchat password.

# TODO

- direct messages
- channel joining
- channel events (topic changes, users joining etc)
- markdown parsing and coercion to irc formatting
- file upload links
- file upload via DCC
- settings via password (e.g. appending `.noformat` to password)
- message searches
- user searches
- room listing + searching