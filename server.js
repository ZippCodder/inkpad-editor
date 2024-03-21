const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer();

server.on("request",(req,res) => {
 let contentType = "text/plain", file;

 switch (path.parse(req.url).ext) {
  case ".html": {
   contentType = "text/html";
  }; 
  break;
  case ".css": {
   contentType = "text/css";
  };
  break;
  case ".js": {
   contentType = "text/javascript";
  }
  break; 
  default: {
   contentType = "image/png";
  }
 }

 try {
  file = fs.readFileSync(__dirname + req.url);
 } catch (err) {
  console.log(err);
 }

 res.setHeader("Content-Type",contentType);
 res.statusCode = 200;
 res.end(file);
});

server.listen(5000,function() {
 console.log("Server is active...");
});

