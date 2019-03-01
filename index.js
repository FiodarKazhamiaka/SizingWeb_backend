//console.log("hello world")

const express = require('express')
const util = require('util')
const fs = require('fs')

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

var bodyParser = require('body-parser');
const execSync = require('child_process').execSync;

const app = express();
const port = 3001;

var NEXT_TRANS_ID = 1;

const request_directory = "./requests/";

//app.use(express);
app.use(bodyParser.json({limit : '50mb'}));

const child_process = require('child_process');

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

async function writeToFS(id, body) {
	let file_name = request_directory + id;
	err = await writeFile(file_name, body);
	if (err) {
    	return console.log(err);
	}
	console.log("wrote to file " + file_name)

	return file_name;
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function callCPP(command, args) {
	

	return new Promise(function(resolve, reject) {
		let output = child_process.spawn(command, args, {	cwd: process.cwd(),
											    env: process.env,
											    stdio: 'pipe',
											    encoding: 'utf-8',
											    shell: true });
		if (output === 0) {
			resolve(output);
		} else {
			reject(output);
		}
	});
	
}

function readSizing(filename) {

	return new Promise(function(resolve, reject) {
		let sizing = fs.readFileSync(filename, "utf8");

		resolve(sizing);
	});

}



// expects json where each field is specified
async function parseRequest(body, res) {

	let trans_id = NEXT_TRANS_ID;
	var nextTransId = NEXT_TRANS_ID + 1;
	
	// set to some default values during testing
	let PV_cost = "2500";
	let B_cost = "460";
	let metric = "0";
	let epsilon = "0.05";
	let confidence = "0.95";
	let days_in_chunk = "100";

	let load_trace_64string = body.load_data;
	let load_trace = Buffer.from(load_trace_64string, 'base64');
	//let solar_trace = lines[8].split(",");
	
	// check each value for correctness; for now, assume correct
	//if () {
	//}
	let load_file_name = await writeToFS(trans_id + "_load", load_trace);
	//let solar_file_name = writeToFS(trans_id + "_solar", solar_trace);
	solar_file_name = "./requests/1_solar";

	let command_full = "/Users/fkazhami/projects/sizingweb_backend/sim " + trans_id + " " + PV_cost + " " + B_cost + " " + metric + " " + epsilon + " " + confidence + " " + days_in_chunk + " " + load_file_name + " " + solar_file_name;
	let command = "/Users/fkazhami/projects/sizingweb_backend/sim"
	let args = [trans_id.toString(), PV_cost, B_cost, metric, epsilon, confidence, days_in_chunk, load_file_name, solar_file_name];
	console.log(command_full);
	//callCPP(command, args).then(readSizing(request_directory + trans_id + ".size")).catch(output => console.log(output)));

	try {
		const output = await child_process.spawn(command, args, {	cwd: process.cwd(),
																    env: process.env,
																    stdio: 'pipe',
																    encoding: 'utf-8',
																    shell: true });
		//console.log("sim output:")
		//console.log(output)
		let sizing = await readFile(request_directory + trans_id + ".size", "utf8");
		//console.log(sizing)
		//respondToPost(sizing, res);
		return sizing; // string in the form "B PV cost"
	} catch(err) {
		console.log(err.stdout);
    	console.log(err.stderr);
    	console.log(err.pid);
    	console.log(err.signal);
    	console.log(err.status);
    	return "error calculating size"
	}

}

//app.use(express.static('public'));

app.get('/', (req, res) => {
	console.log("received get request")
	res.send("blah\n")
})

function respondToPost(result_of_sim, res) {
	let text_split = result_of_sim.split(" ");
	let B_val = text_split[0]
	let C_val = text_split[1]
	let cost_val = text_split[2]

	res.json({ battery: B_val, pv: C_val, cost: cost_val });
}

app.post('/', async (req,res) => {
	console.log("received post request")
	let body = req.body;
	console.log(body);
	let result_of_sim = await parseRequest(body, res);
	respondToPost(result_of_sim, res);

	//res.send('result');
});

app.listen(port, () => console.log(`Listening on port ${port}`));
