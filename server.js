const express = require('express')
const morgan = require('morgan')
const db = require('./database')
const fs = require('fs');

const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const args = require('minimist')(process.argv.slice(2))

const port = args.port || process.env.port || 5000

const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT$', port))
});

if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }

    console.log(logdata)
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next();
  });

  if ((args.debug == true) || (args.d == true)) {
    app.get('/app/log/access', (req, res, next) => {
      const statement = db.prepare('SELECT * FROM accesslog').all();
      res.status(200).json(statement);
  });

  app.get('/app/error', (req, res, next) => {
    throw new Error('Successful: Error.')
  })
}

// a03 part
app.get('/app/', (req, res) => {
    res.statusCode = 200;
    res.statusMessage = 'OK';
    res.writeHead(res.statusCode, { 'Content-Type' : 'text/plain'});
    res.end(res.statusCode+ ' ' +res.statusMessage)
});


app.get('/app/flip/', (req, res) => {
    res.statusCode = 200;
    let aFlip = coinFlip()
    res.json({flip: aFlip})
    res.writeHead(res.statusCode, {'Content-Type' : 'application/json'});
})


app.get('/app/flips/:number', (req, res) => {
    var coins = coinFlips(req.params.number)

    var heads = 0
    var tails = 0
    for (var i=0; i<coins.length; i++) {
        if (coins[i].valueOf() == "heads") {
            heads ++
        } else {
            tails ++
        }
    }

    res.json({"raw" : coins, "summary" : {"heads" : heads, "tails" : tails}})
});

app.get('/app/flip/call/heads', (req, res) => {
    res.statusCode = 200;
    let answer = flipACoin('heads')
    res.send(answer)
    res.writeHead(res.statusCode, {'Content-Type': 'text/plain'});
})

app.get('/app/flip/call/tails', (req, res) => {
    res.statusCode = 200;
    let answer = flipACoin('tails')
    res.send(answer)
    res.writeHead(res.statusCode, {'Content-Type': 'text/plain'});
})


app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});


// a02 part
function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}


function coinFlips(flips) {
    const coins = [];    
    for (let i = 0; i < flips; i++)
    coins[i] = coinFlip();
    return coins;
}

function countFlips(array) {
    let head = 0;
    let tail = 0;
    for( let i = 0; i < array.length; i++)
      if(array[i] == "heads")
        head ++;
      else
        tail ++;
    const count = `{ tails: ${tail}, heads: ${head} }` ;
    return count;
}


function flipACoin(call) {
    let flip = coinFlip();
    return {call: call, flip: flip, result: flip == call ? "win" : "lose" };
}

