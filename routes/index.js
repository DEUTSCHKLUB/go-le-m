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

/* GET FILE TREE BY JOB ID */

router.get("/tree/:jobid", function(req, res) {
  let id = req.params.jobid;
  res.json(tree(path.join(baseJobPath, id)));
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

    /*
      {
        batchFileName: 'Names',
        batchImageSelect: 'b7df1424a881e4d3232e6dd0ebc9d1908309e588.png,images.jpg',
        rotate: '',
        flip: 'horizontal',
        resize: '600',
        aspectRatio: '-extent',
        scale: '105',
        colorCorrections: '-equalize,+channel -normalize',
        colorize: '-colorspace Gray',
        batchId: '1609617590725'
      }
    */

    const {batchFileName, batchImageSelect, colorCorrections, batchId, ...transforms} = req.body;

    console.log(batchFileName, batchImageSelect, colorCorrections, batchId, transforms);

    template.images = batchImageSelect.split(",");

    let tempActions = [];

    let fsName = `$f_${batchFileName}$e`;

    // get the easy transforms added to json 
    for(const [key, value] of Object.entries(transforms)){
      if(value != ""){
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
        child.exec(`npm run --prefix agent process -- --job ${jid} >> agent.log`, function(error, stdout, stderr) {
          console.log(stdout);
          console.log(stderr);
        });
      }

    });

    template.actions.push(action);

    res.json(JSON.stringify(template));
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;