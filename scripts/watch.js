#!/usr/bin/env node

/*
 * Lightweight local watcher.
 *
 * It uses Node's built-in fs.watch so the project does not need another
 * dependency. When an important file changes, it waits briefly and then runs
 * scripts/build.js.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const watchedEntries = ["index.html", "style.css", "script.js", "sw.js", "data", "scripts"];

let timer = null;
let running = false;
let rerunRequested = false;

function scheduleBuild(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => runBuild(reason), 350);
}

function runBuild(reason) {
  if (running) {
    rerunRequested = true;
    return;
  }

  running = true;
  console.log(`\nChange detected (${reason}). Running build...`);

  const child = spawn(process.execPath, ["scripts/build.js"], {
    cwd: projectRoot,
    stdio: "inherit"
  });

  child.on("exit", (code) => {
    running = false;
    console.log(code === 0 ? "Build OK." : `Build failed with exit code ${code}.`);

    if (rerunRequested) {
      rerunRequested = false;
      scheduleBuild("queued change");
    }
  });
}

for (const entry of watchedEntries) {
  const fullPath = path.join(projectRoot, entry);
  if (!fs.existsSync(fullPath)) continue;

  fs.watch(fullPath, { recursive: fs.statSync(fullPath).isDirectory() }, (eventType, fileName) => {
    scheduleBuild(`${entry}${fileName ? `/${fileName}` : ""}:${eventType}`);
  });
}

console.log("Watching project files. Press Ctrl+C to stop.");
