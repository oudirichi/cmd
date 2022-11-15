const chalk = require('chalk');

const { run } = require('../helper');

module.exports = ({ registry }) => {
    const name = 'code';
    const action = async function (projectName) {
        const project = registry.projects[projectName];
        if (!project){
            console.log(chalk.red(`the project ${projectName} is not registred`));
            return;
        }

        return run('code', [project.path]);
    };

    const register = (program) => {
        program
            .command(name)
            .argument('<project>', 'project name to open')
            .action(action);
    }

    return {
        name,
        action,
        register,
    }
}
