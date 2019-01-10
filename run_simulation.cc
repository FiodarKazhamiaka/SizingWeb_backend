#include <fstream>
#include <sstream>
#include <cstring>
#include <cstdlib>
#include <vector>
#include <iostream>
#include <iomanip>
#include <limits>
#include "simulate_system.h"
#include "cheby.h"

using namespace std;

// Read data in and run simulations

vector <double> read_data_from_file(string filename) {
    
    vector <double> data;

	ifstream datafile(filename.c_str());
	if (datafile.fail()) {
    	data.push_back(-1);
    	//cout << errno << endl;
    	return data;
  	}

    // read data file into vector
    string line;
    double value;

    while (getline(datafile, line)) {
    	istringstream iss(line);
    	iss >> value;
    	data.push_back(value);
    }

    return data;
}


// load_filename: filename, each line in file contains electricity consumption value
// solar_filename: filename, each line in file contains solar generation value
// id: request id
// metric: 0 for LOLP, 1 for unmet load
// epsilon: number in range [0,1] representing LOLP or unmet load fraction.
// chunk_size: length of time (in days)

void run_simulations(vector <double> &load, vector <double> &solar, string id, int metric, int chunk_size, int number_of_chunks, bool output_curves) {

	// use this random seed
	srand(10);

	// get number of timeslots in each chunk
	int t_chunk_size = chunk_size*(24/T_u);

	vector <vector<SimulationResult> > results;

	// get random start times and run simulation on this chunk of data
	for (int chunk_num = 0; chunk_num < number_of_chunks; chunk_num += 1) {

		int chunk_start = rand() % solar.size();
		int chunk_end = chunk_start + t_chunk_size;

		vector <SimulationResult> sr = simulate(load, solar, chunk_start, chunk_end, 1);
		results.push_back(sr);

	}

	// print all of the curves
	if (output_curves) {
		int chunk_index = 1;
		for(vector<vector<SimulationResult> >::iterator it = results.begin() ; it != results.end(); ++it) {
			
			ofstream curvefile;
			curvefile.open(id + "_" + to_string(chunk_index) + ".out");
			
			for (vector<SimulationResult>::iterator it2 = it->begin() ; it2 != it->end(); ++it2) {
				curvefile << it2->B << " " << it2->C << " " << it2->cost << endl;
			}
			
			curvefile.close();
			chunk_index += 1;
		}
	}

	// calculate the chebyshev curves, find the cheapest system along their upper envelope, and return it
	SimulationResult sr = calculate_sample_bound(results, epsilon, confidence);
	cout << sr.B << " " << sr.C << " " << sr.cost << endl;

	// print results to file
	ofstream resultfile;
	resultfile.open(output_data_directory + id + ".size");
	resultfile << sr.B << " " << sr.C << " " << sr.cost << endl;
	resultfile.close();

	return;
}

int main(int argc, char ** argv) {

	string outputfile = argv[1];
	
	string inv_PV_string = argv[2];
	PV_inv = stod(inv_PV_string);

	string inv_B_string = argv[3];
	B_inv = stod(inv_B_string)*kWh_in_one_cell; // convert from per-kWh to per-cell cost

	string metric_string = argv[4];
	int metric = stoi(metric_string);

	string epsilon_string = argv[5];
	epsilon = stod(epsilon_string);

	string confidence_string = argv[6];
	confidence = stod(confidence_string);

	string days_in_chunk_string = argv[7];
	int days_in_chunk = stoi(days_in_chunk_string);

	string loadfile = argv[8];

	string solarfile = argv[9];

	int number_of_chunks = 100;

	// read in the data

	// read in data into vector
	vector <double> solar = read_data_from_file(solarfile);
	vector <double> load = read_data_from_file(loadfile);

	if (solar[0] < 0) {
		cout << "error reading solar file " <<  solarfile << endl;
		return 0;
	} 
	if (load[0] < 0) {
		cout << "error reading load file " << loadfile << endl;
		return 0;
	}

	run_simulations(load, solar, outputfile, metric, days_in_chunk, number_of_chunks, false);

}

