const shell = require('shelljs');
const xcode = require('xcode');
const fs = require('fs-extra');
const _ = require('./pathUtil');
const rmrf = require('rimraf');
const ConfigParser = require('cordova-common').ConfigParser;

const IOS_PATH = '.dummy-project/platforms/ios'.safePath;

const replacePlaceholder = (value, name) => value.replace(/{PROJECT_NAME}/g, name);

const renameProjectFiles = (folderName, name) => {
	const files = fs
		.readdirSync(folderName)
		.filter(file => !file.startsWith('.'))
		.map(file => folderName + '/' + file)
		.map(filePath => filePath.safePath);

	for (const fileName of files) {
		if (fs.lstatSync(fileName).isDirectory()) {
			const newName = replacePlaceholder(fileName, name);

			if (newName != fileName) {
				fs.moveSync(fileName, newName);
			}

			renameProjectFiles(newName, name);
		} else {
			const content = fs.readFileSync(fileName).toString();

			fs.writeFileSync(fileName, replacePlaceholder(content, name));
		}
	}
};

const copyConfigFile = (baseFolder, name) =>
	fs.copySync(`${IOS_PATH}/${name}/config.xml`.safePath, `${baseFolder}/Resources/config.xml`.safePath);

const copyPlugins = (baseFolder, name) =>
	fs.copySync(`${IOS_PATH}/${name}/Plugins`.safePath, `${baseFolder}/Plugins`.safePath);

const copyWWWFolder = baseFolder => fs.copySync(`${IOS_PATH}/www`.safePath, `${baseFolder}/Resources/www`.safePath);

const updateConfigXml = (baseFolder, name) => {
	const conf = new ConfigParser(`${baseFolder}/Resources/config.xml`.safePath);
	conf.addElement('allow-navigation', { href: '*' });

	conf.write();
};

const addPlugins = (proj, baseFolder) => {
	const cordovaPluginsFolders = fs
		.readdirSync(`${baseFolder}/Plugins`.safePath)
		.filter(content => fs.lstatSync(`${baseFolder}/Plugins/${content}`.safePath).isDirectory());
	const files = cordovaPluginsFolders
		.map(folder =>
			fs.readdirSync(`${baseFolder}/Plugins/${folder}`.safePath).map(x => `Plugins/${folder}/${x}`.safePath)
		)
		.reduce((acc, x) => [...acc, ...x], []);

	files.forEach(file => {
		if (file.endsWith('.h')) {
			proj.addHeaderFile(file);
		} else {
			proj.addSourceFile(file);
		}
	});
};

const configureiOS = name => {
	const projectPath = `platform/ios/${name}`.safePath;
	shell.rm('-rf', projectPath);
	shell.mkdir('-p', projectPath);

	console.log('Cloning ios template project...\n'.cyan);
	shell.exec(`git clone https://github.com/victorg1991/cordova-templates --branch ios ${projectPath.safePath}`, {
		silent: true
	});
	renameProjectFiles(projectPath, name);

	copyConfigFile(`${projectPath}/${name}`, name);
	copyPlugins(`${projectPath}/${name}`, name);
	copyWWWFolder(`${projectPath}/${name}`);
	updateConfigXml(`${projectPath}/${name}`);

	const xprojPath = `${projectPath}/${name}.xcodeproj/project.pbxproj`.safePath;
	const myProj = xcode.project(xprojPath);

	return new Promise((resolve, reject) => {
		myProj.parse(err => {
			if (err) {
				reject(err);
				return;
			}

			addPlugins(myProj, `${projectPath}/${name}`);

			myProj.addResourceFile('www');
			myProj.addResourceFile('config.xml');

			fs.writeFileSync(xprojPath, myProj.writeSync());

			resolve();
		});
	})

};

module.exports = configureiOS;
