#!/usr/bin/env node

const create = require('cordova-create');
const platform = require('cordova-lib/src/cordova/platform');
const plugin = require('cordova-lib/src/cordova/plugin');
const shell = require('shelljs');
const fs = require('fs-extra');
const EventEmitter = require('events').EventEmitter;
const colors = require('colors');

const configureAndroid = require('./src/configureAndroid');
const configureiOS = require('./src/configureiOS');

if (process.argv.length !== 4) {
	console.log('Usage: screens [ios | android] <project-name>');
	return -1;
}

const platformChoosen = process.argv[2].toLowerCase();
const name = process.argv[3];

if (platformChoosen !== 'ios' && platformChoosen !== 'android') {
	console.log('platform not supported: try with ios or android');
	return -1;
}

const eventEmitter = new EventEmitter();

eventEmitter.on('log', console.log);

// Delete old proyect if exist
shell.rm('-rf', '.dummy-project');
shell.rm('-rf', 'project');

console.log(`\nCreating screens cordova project with name ${name}... 🚚\n`.blue);
console.log('Creating dummy cordova project to fetch files/assets... 📖\n'.cyan);

create('.dummy-project', null, name, null, eventEmitter)
	.then(() => {
		shell.cd('.dummy-project');
		return platform('add', platformChoosen);
	})
	.then(() => {
		console.log('Looking for plugins in the .plugins.screens file...\n'.cyan);
		return getPlugins();
	})
	.then(plugins => {
		plugins.forEach(plugin => console.log(`Detected plugin ${plugin}`.blue));
		console.log('\nInstalling plugins...\n'.cyan);

		const promises = plugins.map(p => plugin('add', p));
		return Promise.all(promises);
	})
	.then(() => {
		shell.cd('..');
		if (platformChoosen === 'ios') {
			return configureiOS(name);
		} else {
			return configureAndroid(name);
		}
	})
	.then(() => {
		console.log('Done! ✅'.green);
	})
	.catch(error => console.log(`ERROR: ${error}`.red));

function getPlugins() {
	try {
		const pluginsFile = fs.readFileSync('../.plugins.screens'.safePath);
		const pluginsToInstall = pluginsFile
			.toString()
			.split('\n')
			.filter(x => x.length !== 0);
		return Promise.resolve(pluginsToInstall);
	} catch (_) {
		return Promise.reject('There is not file .plugins.screens in this directory.');
	}
}
