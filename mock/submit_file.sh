#!/usr/bin/env bash
curl -X POST --header "Content-Type: application/json" -d '{"file_data": "0\n1\n2\n0.1\n3,4,5\n6,7,8"}' "http://localhost:3000/"
