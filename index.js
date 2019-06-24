require('dotenv').config();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const fs = require('fs').promises;

const bodyParser = require('body-parser')

if(!process.env.HOME_DIR) {
    console.error('[ERROR] Missing environmental variable: HOME_DIR')
    process.exit(1);
}

const ZIP_DIR = process.env.ZIP_DIR||`${process.env.HOME_DIR}/zips`

server.listen(process.env.WEBPORT||8080,() => {
    console.info(`Listening on :${process.env.WEBPORT||8080}`)
})
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(require('cors')())
app.use('/',express.static("public"))
app.get('/socket.io-file-client.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});
app.get('/zip/:name/download',(req,res) => {
    res.sendFile(`${ZIP_DIR}/${req.params.name}`,(err) => {
        if(err) res.status(404).send("File Not Found")
    });
})
app.get('/zip/:name/delete',(req,res) => {
    fs.unlink(`${ZIP_DIR}/${req.params.name}`).then(() => {
        fs.readdir(ZIP_DIR)
        .then(r => {
            res.json({
                success:true,
                zips:r.map(v => {return {name:v}})
            })
        })
        .catch(err => {
            res.json({
                success:true,
                warning:'Failed to get list of zips'
            })
        })
    }).catch(err => {
        if(err.code === "ENOENT") {
            return res.status(500).json({error:"That zip does not exist."})
        }
        return res.status(500).json({error:err.message})
    })
})

app.get('*',(req,res) => {
    res.status(404).send("<h1>404</h1>")
})