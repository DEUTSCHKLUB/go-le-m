import path from "path";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Engine, Task, utils, vm, WorkContext } from "yajsapi";
import { program } from "commander";
import fs from "fs";
import * as child from 'child_process';
import tree from 'directory-tree';
import "reflect-metadata"
import { Type, plainToClass, classToPlain } from 'class-transformer'

dayjs.extend(duration);

const { asyncWith, logUtils, range } = utils;

// Actions will be applied to each image, name will be put on each image for output
class JobInfo {
  constructor() {
    this.images = [];
    this.actions = [];
  }

  images: string[];

  @Type(() => JobAction)
  actions: JobAction[];

}

class JobAction {
  constructor(action: string, name: string) {
    this.action = action;
    this.name = name;
  }

  action: string = "";
  name: string = "";
}

enum Status {
  Error = "Error",
  Creating = "Creating",
  Started = "Started",
  Negotiating = "Negotiating",
  Sending = "Sending",
  Processing = "Processing",
  Receiving = "Receiving",
  Complete = "Complete"
}

function updateStatus(jobid: string, status: Status) {
  child.exec(`curl -X POST http://localhost:3001/status/${jobid}/${status}`);
}

// tar cvzf ./jobs/123/input.tar.gz -C ./jobs/123/input/ .
// tar xvzf ./jobs/123/result.tar.gz -C ./jobs/123
// 
function packageJob(jobInputFolder: string, jobOutputFolder: string) {
  // Show files:
  let jobPackage: string = `${jobInputFolder}/input.tar.gz`;

  let treeResults = tree(`${jobInputFolder}/`);
  let treeChildren = treeResults.children;
  
  // Clear out any previous .sh or .tar.gz files from input
  child.exec(`rm ${jobInputFolder}/*.sh`);
  child.exec(`rm ${jobInputFolder}/*.tar.gz`);
  
  // Clear out the previous output
  child.exec(`rm ${jobOutputFolder}/*`);

  /*
  // Create a sample JobInfo object
  let jobInfo: JobInfo = new JobInfo;

  for (let file of treeChildren!) {
    jobInfo.images.push(file.name);
  }

  // Generate actions
  // TODO: Clean the strings to only contain essential characters: +-%^!0-9a-z-A-Z
  jobInfo.actions.push(new JobAction("-resize 1600x1600", "$f_16x16$e"));
  jobInfo.actions.push(new JobAction("-resize 1200x1200", "$f_12x12$e"));
  jobInfo.actions.push(new JobAction("-resize 800x800", "$f_8x8$e"));
  jobInfo.actions.push(new JobAction("-resize 400x400", "$f_4x4$e"));

  // This is generating a sample actions file that we expect to receive
  fs.writeFileSync(`${jobInputFolder}/input/config.json`, JSON.stringify(jobInfo));
  */
  // Now let's process this into a bash script that we want to run
  /// reading in the json file
  var readJson = fs.readFileSync(`${jobInputFolder}/transforms.json`, 'utf8');

  /// parsing into a class
  var readData = plainToClass(JobInfo, JSON.parse(readJson));

  // Great, now we have our class and need to generate the shell commands for it
  let shellScript = `#! /bin/bash\n# shellcheck shell=bash\n`;

  // This assumes we're running from the directory where the images are
  for(let fileName of readData.images) {
    for(let actionString of readData.actions) {
      let outputFileName: string = `/golem/output/${actionString.name.replace("$f", path.basename(fileName, path.extname(fileName))).replace("$e", path.extname(fileName))}`;
      shellScript += `convert ${fileName} ${actionString.action} ${outputFileName}\n`;
    }
  }

  shellScript += `tar cvzf /golem/output/output.tar.gz --exclude='output.log' --exclude='output.tar.gz' -C /golem/output/ .`

  fs.writeFileSync(`${jobInputFolder}/run.sh`, shellScript);

  // Compress files
  child.exec(`tar cvzf ${jobPackage} -C ${jobInputFolder}/ .`);
}

async function main(subnetTag: string, hash: string, job: string, cpu?: number, memory?: number, storage?:number) {
  // Increasing default requirements to remove some slower nodes
  if (cpu == undefined || Number.isNaN(cpu)) {
    cpu = 2;
  }

  if (memory == undefined || Number.isNaN(memory)) {
    memory = 4;
  }

  if (storage == undefined || Number.isNaN(storage)) {
    storage = 2;
  }

  console.log("subnet=", subnetTag);
  console.log("hash=", hash);
  console.log("job=", job);
  console.log("cpu=", cpu);
  console.log("memory=", memory);
  console.log("storage=", storage);

  let jobRootFolder = `${__dirname}/../jobs`;
  let jobInputFolder: string = `${jobRootFolder}/input/${job}`;
  let jobPackage: string = `${jobInputFolder}/input.tar.gz`;
  let jobOutputFolder: string = `${jobRootFolder}/output/${job}`;
  let jobOutputFile: string = `${jobOutputFolder}/output.tar.gz`;

  updateStatus(job, Status.Started);

  packageJob(jobInputFolder, jobOutputFolder);

  const _package = await vm.repo(hash, memory, storage, cpu);

  let workDefinition = async function* worker(ctx: WorkContext, tasks) {
    let sentPackageFile = "/golem/work/input.tar.gz";

    updateStatus(job, Status.Sending);

    ctx.send_file(jobPackage, sentPackageFile);

    // updateStatus(job, Status.Processing);

    for await (let task of tasks) {
      let taskDat: any = task.data();

      let commands = [
        "-c",
        `cd /golem/work/;
        tar xvzf ${sentPackageFile};
        ls -lahR /golem > /golem/output/output.log;
        chmod +x run.sh;
        ./run.sh;
        ls -lahR /golem >> /golem/output/output.log;`
      ]

      ctx.run("/bin/sh", commands);

      updateStatus(job, Status.Processing); // Should be Receiving

      ctx.download_file(
        '/golem/output/output.log', //outputFile,
        `${jobOutputFolder}/output.log` //jobResults
      );
      
      ctx.download_file(
        '/golem/output/output.tar.gz', //outputFile,
        `${jobOutputFile}` //jobResults
      );

      /*ctx.download_file(
        outputFile, //outputFile,
        jobResults //jobResults
      );*/
      yield ctx.commit();

      updateStatus(job, Status.Complete);

      // TODO: Check
      // job results are valid // and reject by:
      // task.reject_task(msg = 'invalid file')
      task.accept_task(jobOutputFile);
    }

    ctx.log("no more sizes to process");
    return;
  }
  
  let taskGetter = function getTasks(): any[] {
    return [0];
  }
    
  let timeout: number = dayjs.duration({ minutes: 10 }).asMilliseconds();
  let workers: number = 1;

  console.log("task getter=", taskGetter);
  console.log("tasks=", taskGetter());
  console.log("timeout=", timeout);
  console.log("work def=", workDefinition);
  console.log("workers=", workers);

  updateStatus(job, Status.Negotiating);

  await asyncWith(
    await new Engine(
      _package,
      workers,
      timeout, //5 min to 30 min
      "10.0", // Budget
      undefined,
      subnetTag,
      logUtils.logSummary()
    ),
    async (engine: Engine): Promise<void> => {
      for await (let task of engine.map(
        workDefinition,
        taskGetter().map((frame) => new Task(frame))
      )) {
        console.log("result=", task.output());
      }
    }
  );
  return;
}

function parseIntParam(value: string) {
  return parseInt(value);
}

console.log(process.argv);

program
  .option('--subnet-tag <subnet>', 'set subnet name', 'community.3')
  .option('-d, --debug', 'output extra debugging')
  .requiredOption('-h, --hash <hash>', 'golem VM image hash', 'b02b0be31c29b3b1982de333add8c660deb245cfa036f284a73a35b1')
  .requiredOption('-j, --job <string>', 'ID of job to process')
  .option('-c, --cpu <number>', '# of cores required', parseIntParam)
  .option('-m, --memory <number>', 'GB of memory required', parseIntParam)
  .option('-s, --storage <number>', 'GB of storage required', parseIntParam);
program.parse(process.argv);
if (program.debug) {
  utils.changeLogLevel("debug");
}
console.log(`Using subnet: ${program.subnetTag}`);
main(program.subnetTag, program.hash, program.job, program.cpu, program.memory, program.storage);