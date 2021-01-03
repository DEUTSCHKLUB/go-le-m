const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      formidable = require('formidable'),
      baseJobPath = `${appRoot}/jobs/input`,
      child = require('child_process'),
      tree = require("directory-tree"),
      { spawn, exec, execFile } = require('child_process'),
      config = `{
          "images":[],
          "actions":[]
      }`;
      router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: "Go Le'M – Photo Processing Machin" });
});

/* IMAGE UPLOAD AND SAVE TO DISK ENDPOINT */

router.post("/upload/:jobid", function(req, res) {
  const form = formidable({ multiples: true }),
        jid = req.params.jobid;

  form.uploadDir = path.join(baseJobPath, jid);
  if (!fs.existsSync(form.uploadDir)){
    fs.mkdirSync(form.uploadDir);
  }
  
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name),function (err) {
      if (err) throw err;
    });
  }); 
  
  form.on('error', function(err) {
    console.log('A file upload error has occured: \n' + err);
  }); 
  
  form.on('end', function() {
    setTimeout((function() {res.json({id:jid,imgs:tree(form.uploadDir)})}), 800);
  }); 
  
  form.parse(req);
});

/* IMAGE UPLOAD AND SAVE TO DISK ENDPOINT */
router.post("/create/:jobid", function(req, res) {
  try {
    // notes, gotta split the file select field and the color correction field into an array
    let template = JSON.parse(config); // <- this is for later
    let jid = req.params.jobid;
    let resItems = {};

    const {batchFileName, batchImageSelect, colorCorrections, batchId, ...transforms} = req.body;

    console.log(batchFileName, batchImageSelect, colorCorrections, batchId, transforms);

    template.images = batchImageSelect.split(",");

    resItems.name = batchFileName;
    resItems.jobid = jid;
    resItems.ops = [];

    let tempActions = [];

    let fsName = `$f_${batchFileName}$e`;

    // get the easy transforms added to json 
    for(const [key, value] of Object.entries(transforms)){
      if(value != ""){
        resItems.ops.push(key);
        let action = "";
        
        if (key == 'flip' || key == 'colorize') {
          action = value;
        } else {
          action = `${key} ${value}`;
        }

        tempActions.push(action);
      }
    }

    // split and add color corrections

    for(let cc of colorCorrections.split(",")){
      if(cc != ""){
        resItems.ops.push('color-correction');
        tempActions.push(cc);
      }
    }

    let combinedAction = "";
    for(let action of tempActions) {
      // Add percent to necessary slider functions
      if (action.includes("scale")) {
        action = `${action}%`;
      }

      if(!action.startsWith("-") && !action.startsWith("+")) {
        action = `-${action}`;
      }
      combinedAction += action + " ";
    }
    
    console.log(`combined action: ${combinedAction}`);
    console.log(`fsName: ${fsName}`);

    let action = {
            "action":combinedAction,
            "name":fsName
    };
    
    template.actions.push(action);

    fs.writeFile(path.join(baseJobPath, jid,'transforms.json'), JSON.stringify(template), (err) => { 
      if (err) {
        throw err; 
      } else {
        console.log(`Job ${jid} created.`);
        // Add data to status endpoint
        global.jobStatus[jid] = new JobStatus(jid, Status.Creating);
        console.log(JSON.stringify(global.jobStatus));
        child.exec(`npm run --prefix agent process -- --job ${jid} >> agent.log`, function(error, stdout, stderr) {
          console.log(stdout);
          console.log(stderr);
        });
      }

    });

    template.actions.push(action);

    res.json(JSON.stringify(resItems));
  } catch (error) {
    console.error(error);
  }
});

// Classes and endpoints for status
class JobStatus {
  constructor(jobId, status) { 
    this.jobId = jobId; 
    this.status = status; 
 }
}

const Status = Object.freeze({
  Error:   "Error",
  Creating:  "Creating",
  Started: "Started",
  Negotiating: "Negotiating",
  Sending: "Sending",
  Processing: "Processing",
  Receiving: "Receiving",
  Complete: "Complete"
});


router.get("/status", function(req, res, next) {
  try {
    res.write("Jobs:\n");
    for(let jid in global.jobStatus) {
      let lookup = global.jobStatus[jid];
      res.write(`${lookup.jobId} ${lookup.status}\n`);
    }
    res.end();

  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get("/status/:jobid", function(req, res, next) {
  let jid = req.params.jobid;
  try {

    if(global.jobStatus[jid] == undefined) {
      res.status(400).send('Bad Request');
    } else {
      let lookup = global.jobStatus[jid];
      res.status(200).send(`${lookup.status}`);
    }
    
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/status/:jobid/:jobstatus", function(req, res, next) {
  let jid = req.params.jobid;
  let status = req.params.jobstatus;
  try {
    if(global.jobStatus[jid] == undefined) {
      res.status(400).send('Bad Request');
    } else {
      global.jobStatus[jid].status = status;
      res.status(200).send(`${jid} updated to ${status}`);
    }
    
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;