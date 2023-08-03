require("dotenv").config();
var path = require("path");
var http = require('http');
var mongoose = require("mongoose");
const bodyParser = require('body-parser');
var cors = require("cors");
var express = require("express");
var cookieParser = require("cookie-parser");

var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");

const MONGODB_URL = process.env.MONGODB_URL,
    port = process.env.PORT || '2003';


// DB connection
mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    if (process.env.NODE_ENV !== "test") {
        console.log("Connected to %s", MONGODB_URL);
        console.log("App is running ... \n");
        console.log("Press CTRL + C to stop the process. \n");
    }
}).catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
});
var db = mongoose.connection;

var app = express();
app.use(express.json());
app.use(bodyParser.json({ limit: "15360mb", type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "client/build")));


app.use(cors()); //To allow cross-origin requests

//Route Prefixes
app.use("/api/", apiRouter);
app.use("/", indexRouter);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.use((err, req, res) => {
    if (err.name == "UnauthorizedError") {
        return apiResponse.unauthorizedResponse(res, err.message);
    }
});

app.set('port', port);

var server = http.createServer(app);

server.listen(port, () => console.log('server is running on port: ', port));
