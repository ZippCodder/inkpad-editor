const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const protocol = (process.env.MODE === "development") ? http:https;
const server = protocol.createServer((process.env.MODE === "production") ? {key: fs.readFileSync(process.env.KEY_PATH), cert: fs.readFileSync(process.env.CERT_PATH)}:undefined);

server.on("request",(req,res) => {
 let contentType = "text/plain", file;

 if (req.url === "/") {
 try {
  file = fs.readFileSync(__dirname + "/src/pages/index.html");
 } catch (err) {
  console.log(err);
 }

 res.setHeader("Content-Type", "text/html");
 res.statusCode = 200;
 res.end(file);
 
 return; 
 }

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

server.listen(process.env.PORT,function() {
 console.log("Server is active...");
});

