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

# Options

A full list of possible environment options:

| Environment Variable | Default              | Description                                                                                      |
|----------------------|----------------------|--------------------------------------------------------------------------------------------------|
| LOG_LEVEL            | warn                 | Maximum log level to be printed to the console. Possible values: trace, debug, warn, info, error |
| ROCKETCHAT_HOST      |                      | **(required)** Hostname of the rocketchat server to connect to                                   |
| ROCKETCHAT_PORT      | 443                  | Port of the rocketchat server to connect to                                                      |
| ROCKETCHAT_SECURE    | true                 | Whether to connect to rocketchat with HTTPS or not                                               |
| SERVER_HOST          | irc.$ROCKETCHAT_HOST | Hostname of the IRC gateway                                                                      |
| SERVER_PORT          | 6667                 | Port of the insecure IRC server                                                                  |
| SERVER_SECURE        | false                | Whether to host an SSL server too                                                                |
| SERVER_SECURE_PORT   | 6697                 | Port of the secure IRC server                                                                    |
| SERVER_KEY           | server-key.pem       | Path of the server key                                                                           |
| SERVER_CERT          | server-cert.pem      | Path of the server cert                                                                          |
| SERVER_CA            | ca-cert.pem          | Path of the CA cert (only needed if self signed)                                                 |
| SERVER_SELF_SIGNED   | false                | Whether or not the certificate is self signed                                                    |

# TODO

- channel joining
- channel events (topic changes, users joining etc)
- markdown parsing and coercion to irc formatting
- file upload links
- file upload via DCC
- settings via password (e.g. appending `.noformat` to password)
- message searches
- user searches
- room listing + searching
- upload code blocks as snippets to a webserver
- editing messages from IRC client
- deleting messages from IRC client
- SASL auth