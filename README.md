# CMD
The purpose of this project is to simplify the burden of working with multiple project

## Installation
```
npm install -g https://github.com/oudirichi/cmd.git
```

## Usage
### Register
First of all, you need to register folder to be allowed. You can also pass a default command to be used.

```
cmd register
cmd register ./executable-file.js
cmd register -n <alias name for that folder>
```

The folder name will be the command to pass. Example the project is pew:
```
cmd help pew
```

The -f flag allow to make the following command the fallback when no command is given.
### list
Allow to dump the config file for debugging

### allow
Allow command to be passed at the project.
```
cmd pew allow [the command: make, ls, rake, ...]
```
