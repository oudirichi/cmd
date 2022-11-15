#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

const program = require('commander');
const { version, name } = require("./package.json");

const regPath = path.join(__dirname, "registry.json");

const saveRegistry = (registry) => {
  console.log(`saving registry`, registry);
  console.log(`saving registry path`, regPath);
  return fs.writeFile(regPath, JSON.stringify(registry, null, 2));
}

const getRegistry = async () => {
  const fileExist = existsSync(regPath);
  if (!fileExist) await saveRegistry({});
  const registry = require(regPath);

  return registry;
}

const chalk = require('chalk');
const codeCmd = require('./commands/code');

const { run } = require('./helper');
program
  .name(name)
  .version(version);

(async function() {
  const registry = await getRegistry();
  const allowedCmds = ['npm', 'yarn', 'code', ...(registry.allowedCmds || [])];
  const code = codeCmd({ registry });

  program
    .command('register')
    .argument('[executable]', 'default executable')
    .option("-n, --name <name>", "name of the command")
    .option("-f, --fallback", "set the script as fallback")
    .action(async function (executable, options) {
      if (options.fallback) {
        registry.fallback = executable;
        await saveRegistry(registry);
        return;
      }

      const name = options.name || process.cwd().split('/').pop();

      if (!registry.projects) registry.projects = {};

      registry.projects[name] = { path: process.cwd(), executable: executable };

      await saveRegistry(registry);
    });

  code.register(program);
  // program
  //   .command('code')
  //   .argument('<project>', 'project name to open')
  //   .action(async function (projectName) {
  //     const project = registry.projects[projectName];
  //     if (!project){
  //       console.log(chalk.red(`the project ${projectName} is not registred`));
  //       return;
  //     }

  //     return run('code', [project.path]);
  //   });

  program
    .command('allow')
    .argument('<command>', 'command name')
    .action(async function (commandName) {
      if (!Array.isArray(registry.allowedCmds)) registry.allowedCmds = [];

      registry.allowedCmds.push(commandName);

      await saveRegistry(registry);
    });

  program
    .command('list')
    .action(function() {
      console.log(registry);
    });

    Object.entries(registry.projects || []).forEach(([key, project]) => {
      program
      .command(key)
      .argument('[command]', `command to execute, allowed outside of the executable are : [${allowedCmds.join(', ')}]`)
      .argument('[arguments...]', `all options and arguments to pass to the command`)
      .allowUnknownOption()
      .action(async function(command, arguments) {
        if (allowedCmds.includes(command)) {
          if (command === code.name) {
            code.action(key);
            return;
          }
          try {
            await run(command, arguments, { cwd: project.path });
          } catch (e) {
            console.error(chalk.red(`cannot execute the command '${command}' in '${key}'.`));
            console.error(chalk.red(`See the following error:`));
            console.log(e);
            console.error(chalk.red(`Make sure the command '${command}' is installed and is executable`));
          }

          return;
        }

        if (command !== undefined) {
          arguments = [command, ...arguments];
        }

        if (!project.executable) return;
        try {
          await run(project.executable, arguments, { cwd: project.path });
        } catch (e) {
          console.error(chalk.red(`cannot execute the command '${project.executable}' in '${key}'.`));
          console.error(chalk.red(`See the following error:`));
          console.log(e);
          console.error(chalk.red(`Make sure the command '${project.executable}' is executable`));
        }
      });
    });

  program.on('command:*', async function(opts) {
    if (!registry.fallback) return;

    try {
      await run(registry.fallback, opts);
    } catch (e) {
      console.error(chalk.red(e));
    }
  });

  await program.parse(process.argv);
})();
