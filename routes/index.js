const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      formidable = require('formidable'),
      baseJobPath = `${appRoot}/jobs/input`,
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
  // notes, gotta split the file select field and the color correction field into an array
  let template = JSON.parse(config); // <- this is for later
  let jid = req.params.jobid;
  let resItems = {};

  const {batchFileName, batchImageSelect, colorCorrections, batchId, ...transforms} = req.body;

  template.images = batchImageSelect.split(",");

  resItems.name = batchFileName;
  resItems.jobid = jid;
  resItems.ops = [];
  // get the easy transforms added to json 
  for(const [key, value] of Object.entries(transforms)){
    if(value != ""){
      resItems.ops.push(key);
      let fsname = value.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,"-").toLowerCase();
      let action = {
              "action":`${key} ${value}`,
              "name":`${batchFileName}_$f_${key}_${fsname}$e`
      };
      template.actions.push(action);
    }
  }

  // split and add color corrections

  for(let cc of colorCorrections.split(",")){
    if(cc != ""){
      resItems.ops.push('color-correction');
      let fsname = cc.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,"-").toLowerCase();
      let action = {
              "action":`${cc}`,
              "name":`${batchFileName}_$f_${cc}_${fsname}$e`
      };
      template.actions.push(action);
    }
  }
  
  fs.writeFile(path.join(baseJobPath, jid,'transforms.json'), JSON.stringify(template), (err) => { 
    if (err) throw err; 
    console.log(`Job ${jid} created.`)
  });

  res.json(JSON.stringify(resItems));
});

module.exports = router;