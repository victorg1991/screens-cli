const path = require('path');

Object.defineProperty(String.prototype, 'safePath', {
	get: function () {
		return path.join(...this.split('/'));
	}
});