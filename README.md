# Go le' Machin
## Summary ##
Go le’ M. is a web based bulk image editor that uses the golem network for computation.

It allows users to upload multiple images and apply bulk actions to them, including:
* Rotate
* Flip
* Resize
* Scale
* Color Correction
* Colorize

Results are returned in single archive file.

## Use ##
* Upload images into the envelope to add them to the batch
* Enter a name for the batch
    * Files will have the batch name appended to them
* Select the image manipulation operations you would like to perform
* Click "Order Prints" to send the job to the golem network
* When the job is done click "Get Prints!" to download the ouput archive


## Set-Up ##
* works best on NodeJS 14
* Install the yagna daemon as described in the [golem handbook](https://handbook.golem.network/requestor-tutorials/flash-tutorial-of-requestor-development)
* run the command `npm install`
* run the command `npm install --prefix agent install`
* run the `start.sh` script to automatically start the yagna daemon and run the web application
    * if you are already running the yagna daemon you may just run `PORT=3001 npm run start`
    * the PORT environment variable is important because the front-end is currently hard-coded to this port
* open your browser and go to: http://localhost:3001/

## Known Limitations ##
* Only 10 MB of images may be uploaded
* If the result archive is too large (50 MB+) the network may not be able to process it within the 30 minute time limit for Alpha III

## Potential Features ##
* Support for multiple sub-jobs in a single batch
* Support for larger data sets
* Support for reading & writing files from:
    * HTTPS
    * WebDAV
    * S3
    * IPFS