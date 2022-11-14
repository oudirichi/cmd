#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

const program = require('commander');
const { version, name } = require("./package.json");

const regPath = path.join(__dirname, "registry.json");
const registry = require(regPath);
const execa = require('execa');
const chalk = require('chalk');

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts });

program
  .name(name)
  .version(version);

program
  .command('register')
  .argument('<file>', 'file to register')
  .option("-n, --name <name>", "name of the command")
  .option("-f, --fallback", "set the script as fallback")
  .action(async function (file, options) {
    if (options.fallback) {
      registry.fallback = file;
      await fs.writeFile(regPath, JSON.stringify(registry, null, 2));
      return;
    }

    console.log(options, process.cwd());
    const name = options.name || process.cwd().split('/').pop();
    registry.projects[name] = { path: process.cwd(), executable: file };
    await fs.writeFile(regPath, JSON.stringify(registry, null, 2));
  });

program
  .command('code')
  .argument('<project>', 'project name to open')
  .action(async function (projectName) {
    const project = registry.projects[projectName];
    if (!project){
      console.log(chalk.red(`the project ${projectName} is not registred`));
      return;
    }

    run('code', [project.path]);
  });

program
  .command('list')
  .action(function() {
    console.log(registry);
  });

Object.entries(registry.projects).forEach(([key, project]) => {
    program
  .command(key)
  .allowUnknownOption()
  .action(async function(options) {
    const [, ...opts] = program.args;
    try {
      await run(project.executable, opts, { cwd: project.path });
    } catch (e) {
      console.error(chalk.red(e));
      console.error(project);
    }
  });
});

program.on('command:*', async function(opts) {
  try {
    await run(registry.fallback, opts);
  } catch (e) {
    console.error(chalk.red(e));
  }
});

program.parse(process.argv);
