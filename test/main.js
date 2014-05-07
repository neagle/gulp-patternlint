var patternLintPlugin = require('../');
var should = require('should');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
require('mocha');

var getFile = function (filePath) {
	filePath = 'test/' + filePath;
	return new gutil.File({
		path: filePath,
		cwd: 'test/',
		base: path.dirname(filePath),
		contents: fs.readFileSync(filePath)
	});
};

describe('gulp-patternlint', function () {
	describe('patternLintPlugin()', function () {
		it('should pass file through', function (done) {
			var a = 0;

			var file = getFile('fixtures/noproblems.js');

			var stream = patternLintPlugin('test/.patternlintrc');
			stream.on('data', function (newFile) {
				should.exist(newFile);
				should.exist(newFile.path);
				should.exist(newFile.relative);
				should.exist(newFile.contents);
				newFile.path.should.equal('test/fixtures/noproblems.js');
				newFile.relative.should.equal('noproblems.js');
				a += 1;
			});

			stream.once('end', function() {
				a.should.equal(1);
				done();
			});

			stream.write(file);
			stream.end();
		});

		it('should send success status', function (done) {
			var a = 0;

			var file = getFile('fixtures/noproblems.js');

			var stream = patternLintPlugin('test/.patternlintrc');
			stream.on('data', function(newFile) {
				a += 1;
				should.exist(newFile.patternlint.success);
				newFile.patternlint.success.should.equal(true);
				should.not.exist(newFile.patternlint.results);
				should.not.exist(newFile.patternlint.opt);
			});
			stream.once('end', function() {
				a.should.equal(1);
				done();
			});

			stream.write(file);
			stream.end();
		});

		it('should send failure status', function(done) {
			var a = 0;

			var file = getFile('fixtures/problems.css');

			var stream = patternLintPlugin('test/.patternlintrc');
			stream.on('data', function(newFile) {
				a += 1;
				should.exist(newFile.patternlint.success);
				newFile.patternlint.success.should.equal(false);
				should.exist(newFile.patternlint.results);
			});
			stream.once('end', function() {
				a.should.equal(1);
				done();
			});

			stream.write(file);
			stream.end();
		});

		it('should lint two files', function(done) {
			var a = 0;

			var file1 = getFile('fixtures/problems.css');
			var file2 = getFile('fixtures/http.js');

			var stream = patternLintPlugin('test/.patternlintrc');
			stream.on('data', function (newFile) {
				a += 1;
			});

			stream.once('end', function () {
				a.should.equal(2);
				done();
			});

			stream.write(file1);
			stream.write(file2);
			stream.end();
		});

		it('should support options', function (done) {
			var a = 0;

			var file = getFile('fixtures/console.js');

			var stream = patternLintPlugin({
				message: 'Don\'t leave any console statements in your JS.',
				pattern: 'console.log'
			});
			stream.on('data', function (newFile) {
				a += 1;
				should.exist(newFile.patternlint.success);
				newFile.patternlint.success.should.equal(false);
				should.exist(newFile.patternlint.results);
				should.exist(newFile.patternlint.rules);
			});
			stream.once('end', function () {
				a.should.equal(1);
				done();
			});

			stream.write(file);
			stream.end();
		});

		it('should support patternlintrc', function (done) {
			var a = 0;

			var file = getFile('fixtures/problems.css');

			var stream = patternLintPlugin('test/.patternlintrc');
			stream.on('data', function (newFile) {
				a += 1;
				should.exist(newFile.patternlint.success);
				newFile.patternlint.success.should.equal(false);
				should.exist(newFile.patternlint.results);
				should.exist(newFile.patternlint.rules);
			});
			stream.once('end', function() {
				a.should.equal(1);
				done();
			});

			stream.write(file);
			stream.end();
		});
	});
});
