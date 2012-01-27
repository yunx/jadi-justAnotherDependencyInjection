


global.logger = require("./logger.js").logger();
var server = require("./src/nodePlugIn.js").jadi().createServer(['./resource/config.js']);

server.listen(8080);