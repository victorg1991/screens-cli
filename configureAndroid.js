const fs = require('fs-extra');
const shell = require('shelljs');
const colors = require('colors');
const _ = require('./pathUtil');
const ANDROID_PATH = '.dummy-project/platforms/android';
const DEFAULT_ACTIVITY = `
package com.liferay.screenscordova;

import android.os.Bundle;
import android.app.Activity;

public class MainActivity extends Activity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
	}
}
`

const copyWWWfolder = (baseFolder) => {
	fs.copySync(`${ANDROID_PATH}/assets`.safePath, `${baseFolder}/app/src/main/assets`.safePath);
}

const copyJavaPluginFiles = (baseFolder) => {
	const plugins = fs.readdirSync(`${ANDROID_PATH}/src`.safePath).filter(p => p !== 'io');

	for (const plugin of plugins) {
		fs.copySync(`${ANDROID_PATH}/src/${plugin}`.safePath, `${baseFolder}/app/src/main/java/${plugin}`.safePath);
	}
}

const copyAndroidManifest = (baseFolder) => {
	fs.copySync(`${ANDROID_PATH}/AndroidManifest.xml`.safePath, `${baseFolder}/app/src/main/AndroidManifest.xml`.safePath)

	const manifest = fs.readFileSync(`${baseFolder}/app/src/main/AndroidManifest.xml`.safePath);
	const manifestChanged = manifest.toString().replace('io.cordova.hellocordova', 'com.liferay.screenscordova');

	fs.writeFileSync(`${baseFolder}/app/src/main/AndroidManifest.xml`.safePath, manifestChanged);
}

const copyResFiles = (baseFolder) => {
	fs.copySync(`${ANDROID_PATH}/res`.safePath, `${baseFolder}/app/src/main/res`.safePath);
}

const replaceMainActivity = (baseFolder) => {
	shell.mkdir('-p', `${baseFolder}/app/src/main/java/com/liferay/screenscordova`.safePath);
	fs.writeFileSync(`${baseFolder}/app/src/main/java/com/liferay/screenscordova/MainActivity.java`.safePath, DEFAULT_ACTIVITY);
}

const createAndroid = (name) => {
	const projectPath = `platform/${name}`
	shell.rm('-rf', 'platform');
	shell.mkdir('-p', projectPath);

	console.log('Cloning android template project...\n'.cyan)
	shell.exec(`git clone https://github.com/victorg1991/cordova-templates ${projectPath.safePath}`, { silent: true });

	copyWWWfolder(projectPath);
	copyJavaPluginFiles(projectPath);
	copyResFiles(projectPath);
	copyAndroidManifest(projectPath);
	replaceMainActivity(projectPath);
}


module.exports = createAndroid;