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
  // notes, gotta split the file select field and the color correction field into an array
  // let template = JSON.parse(config); // <- this is for later
  let jid = req.params.jobid;
  
  fs.writeFile(path.join(baseJobPath, jid,'transforms.json'), JSON.stringify(req.body), (err) => { 
    if (err) throw err; 
    console.log(`Job ${jid} created.`)
  });

  res.json(req.body);
});

module.exports = router;