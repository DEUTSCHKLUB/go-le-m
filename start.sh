#! /bin/bash
# shellcheck shell=bash
echo "Waiting for yagna to start"
yagna service run > yagna.log 2>&1 &
sleep 5
echo "Dropping App key"
yagna app-key drop requester
echo "Getting App key"
export YAGNA_APPKEY=$(yagna app-key create requester)
echo "Initializing payment"
yagna payment init -r --driver=NGNT
echo "Running web server"
npm run start
