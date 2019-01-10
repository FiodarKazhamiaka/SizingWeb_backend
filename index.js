//console.log("hello world")

const express = require('express')
const fs = require('fs')
var bodyParser = require('body-parser');
const execSync = require('child_process').execSync;

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
	let metric = lines[3]
	let epsilon = lines[4];
	let confidence = lines[5];
	let days_in_chunk = lines[6];
	let load_trace = lines[7].split(",");
	let solar_trace = lines[8].split(",");
	
	// check each value for correctness; for now, assume correct
	//if () {
	//}
	writeToFS(trans_id + "_load", load_trace);
	writeToFS(trans_id + "_solar", solar_trace);

	let command = "./sim " + trans_id + " " + PV_cost + " " + B_cost + " " + metric + " " + epsilon + " " + confidence + " " + days_in_chunk + " " + load_trace + " " + solar_trace;

	const output = execSync(command);

	var text = fs.readFileSync(request_directory + trans_id + ".size");

	return text; // in the form "B PV cost"
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
