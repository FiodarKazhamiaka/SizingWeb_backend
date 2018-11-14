//console.log("hello world")

const express = require('express')
const fs = require('fs')
var bodyParser = require('body-parser');

const app = express();
const port = 3000;

const request_directory = "./requests/";

//app.use(express);
app.use(bodyParser.json());

function writeToFS(id, body) {
	let file_name = request_directory + id;
	fs.writeFile(file_name, body,function(err) {
    	if(err) {
        	return console.log(err);
    	}
	});
	console.log("wrote to file " + file_name)
}

// expects file where each field is separated by newlines
function parseRequest(body) {
	let lines = body.split("\n");
	let trans_id = lines[0];
	let PV_cost = lines[1];
	let B_cost = lines[2];
	let epsilon = lines[3];
	let load_trace = lines[4].split(",");
	let solar_trace = lines[5].split(",");
	// check each value for correctness; for now, assume correct
	//if () {
	//}
	writeToFS(trans_id, body)

	return "success"
}

//app.use(express.static('public'));

app.get('/', (req, res) => {
	console.log("received get request")
	res.send("blah\n")
})

app.post('/', (req,res) => {
	console.log("received post request")
	let body = req.body.file_data;
	console.log(body);
	let result = parseRequest(body);
	res.send('result');


});

app.listen(port, () => console.log(`Listening on port ${port}`));
