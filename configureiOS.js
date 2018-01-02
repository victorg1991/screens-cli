const shell = require('shelljs');
const xcode = require('xcode');
const fs = require('fs-extra');
const rmrf = require('rimraf');
const ConfigParser = require('cordova-common').ConfigParser;

const IOS_PATH = '.dummy-project/platforms/ios';

const replacePlaceholder = (value, name) => value.replace(/{PROJECT_NAME}/g, name);

const renameProjectFiles = (folderName, name) => {
	const files = fs.readdirSync(folderName)
		.filter(file => !file.startsWith('.'))
		.map(file => folderName + '/' + file);

	for (const fileName of files) {
		if (fs.lstatSync(fileName).isDirectory()) {
			const newName = replacePlaceholder(fileName, name);

			if (newName != fileName) {
				fs.moveSync(fileName, newName);
			}

			renameProjectFiles(newName, name);
		}
		else {
			const content = fs.readFileSync(fileName).toString();

			fs.writeFileSync(fileName, replacePlaceholder(content, name));
		}
	}
}

const copyConfigFile = (baseFolder, name) =>
	fs.copySync(`${IOS_PATH}/${name}/config.xml`, `${baseFolder}/Resources/config.xml`);

const copyPlugins = (baseFolder, name) =>
	fs.copySync(`${IOS_PATH}/${name}/Plugins`, `${baseFolder}/Plugins`);

const copyWWWFolder = (baseFolder) =>
	fs.copySync(`${IOS_PATH}/www`, `${baseFolder}/Resources/www`);

const updateConfigXml = (baseFolder, name) => {
	const conf = new ConfigParser(`${baseFolder}/Resources/config.xml`);
	conf.addElement("allow-navigation", { href: '*' });

	conf.write();
}

const addPlugins = (proj, baseFolder) => {
	const cordovaPluginsFolders = fs.readdirSync(`${baseFolder}/Plugins`).filter(content => fs.lstatSync(`${baseFolder}/Plugins/${content}`).isDirectory());
	const files = cordovaPluginsFolders.map(folder => fs.readdirSync(`${baseFolder}/Plugins/${folder}`).map(x => `Plugins/${folder}/${x}`)).reduce((acc, x) => [...acc, ...x], []);

	files.forEach(file => {
		if (file.endsWith('.h')) {
			proj.addHeaderFile(file);
		}
		else {
			proj.addSourceFile(file);
		}
	})
}

const configureiOS = (name) => {
	const projectPath = `platform/ios/${name}`
	shell.rm('-rf', projectPath);
	shell.mkdir('-p', projectPath);

	console.log('Cloning ios template project...\n'.cyan)
	shell.exec(`git clone https://github.com/victorg1991/cordova-templates --branch ios ${projectPath.safePath}`, { silent: true });
	renameProjectFiles(projectPath, name);

	copyConfigFile(`${projectPath}/${name}`, name);
	copyPlugins(`${projectPath}/${name}`, name);
	copyWWWFolder(`${projectPath}/${name}`);
	updateConfigXml(`${projectPath}/${name}`);

	const xprojPath = `${projectPath}/${name}.xcodeproj/project.pbxproj`;
	const myProj = xcode.project(xprojPath);

	myProj.parse(err => {
		addPlugins(myProj, `${projectPath}/${name}`);

		myProj.addResourceFile('www');
		myProj.addResourceFile('config.xml');

		fs.writeFileSync(xprojPath, myProj.writeSync());
	});
}

module.exports = configureiOS;
