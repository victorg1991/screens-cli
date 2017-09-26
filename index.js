const create = require('cordova-create');
const platform = require('cordova-lib/src/cordova/platform');
const plugin = require('cordova-lib/src/cordova/plugin');
const shell = require('shelljs');
const fs = require('fs-extra');
const Q = require('Q');
const EventEmitter = require('events').EventEmitter;
const colors = require('colors');

const configureAndroid = require('./configureAndroid');

if (process.argv.length !== 4) {
	console.log('Usage: screens [ios | android] <project-name>');
	return -1;
}

const platformChoosen = process.argv[2].toLowerCase();
const name = process.argv[3];

const eventEmitter = new EventEmitter();

eventEmitter
	.on('log', console.log)

// Delete old proyect if exist
shell.rm('-rf', '.dummy-project');
shell.rm('-rf', 'project');

console.log(`\nCreating screens cordova project with name ${name}... 🚚\n`.blue);
console.log('Creating dummy cordova project to fetch files/assets... 📖\n'.cyan);

create('.dummy-project', null, name, null, eventEmitter)
	.then(() => {
		shell.cd('.dummy-project');
		return platform("add", platformChoosen);
	})
	.then(() => {
		console.log('Installing plugins...\n'.cyan);
		const plugins = getPlugins();
		const promises = plugins.map(p => plugin('add', p));

		return Q.all(promises);
	})
	.then(() => {
		shell.cd('..');
		configureAndroid(name);

		console.log('Done! ✅'.green)
	})
	.catch(error => console.log(error.red));


function getPlugins() {
	const pluginsFile = fs.readFileSync('../.plugins.screens'.safePath);
	const pluginsToInstall = pluginsFile.toString().split('\n').filter(x => x.length !== 0);

	return pluginsToInstall
}