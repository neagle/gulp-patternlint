'use strict';

var gutil = require('gulp-util');
var color = gutil.colors;
var es = require('event-stream');
var fs = require('fs');

var formatOutput = function (report, file, rules) {
	if (!report.messages.length) {
		return {
			success: true
		};
	}

	var filePath = (file.path || 'stdin');

	// Handle errors
	var results = report.messages.map(function (err) {
		if (!err) {
			return;
		}
		return { file: filePath, error: err };
	}).filter(function (err) {
		return err;
	});

	var output = {
		errorCount: results.length,
		success: false,
		results: results,
		rules: rules
	};

	return output;
};

var patternLintPlugin = function (rules) {
	// Read Lint rules from a specified rules.js file.
	var rulesFile;
	if (typeof rules === 'string') {
		// Don't catch readFile errors, let them bubble up
		rulesFile = fs.readFileSync('./' + rules);
	} else if (typeof rules === 'undefined') {
		try {
			rulesFile = fs.readFileSync('./.patternlintrc');
		} catch (err) {
			throw new Error('gulp-patternlint: Please provide either a JS config file of rules or a rules object.');
		}
	}

	if (rulesFile) {
		try {
			rules = JSON.parse(rulesFile);
		}
		catch (err) {
			throw new Error('gulp-patternlint: Error in rules JSON: ' + err);
		}
	}

	if (!Array.isArray(rules)) {
		rules = [ rules ];
	}

	// A function to provide a placeholder string of a given length
	function placeholder(str, num) {
		str += str.substring(0, 1);
		return (str.length >= num) ? str : placeholder(str, num);
	}

	return es.map(function (file, cb) {
		var fileString = String(file.contents);
		var referenceFile = fileString;
		var report = { messages: [] };

		if (rules.length) {
			rules.forEach(function (rule) {
				var exp;
				if (rule.pattern) {
					exp = new RegExp(rule.pattern, 'g');
				} else if (rule.regexp) {
					// Add user-specified flags
					var flags = 'g' + (rule.flags) ? rule.flags: '';
					// Remove any duplicate flags
					flags = flags.replace(/(.)(?=\1){1}/g, '');

					exp = new RegExp(rule.regexp, flags);
				}
				var problems = fileString.match(exp);

				if (problems) {
					for (var i = 0; i < problems.length; i += 1) {
						var problem = problems[i];
						var location = fileString.indexOf(problem);

						// Create pre and post snippets to put the matched problem in context

						// How many characters before / after the problem to show in the excerpt
						var buffer = 25;

						var start = (location - buffer);
						start = (start < 0) ? 0 : start;
						var pre = referenceFile.substring(start, location);

						// Cut off the snippet before the last new line
						if (pre.search(/\n/) !== -1) {
							pre = pre.substring(
								// Find the *last* new line
								pre.length - pre.split('').reverse().join('').search(/\n/),
								pre.length
							);
						}

						var end = (location + problem.length) + buffer;
						end = (end > fileString.length - 1) ? fileString.length - 1 : end;
						var post = referenceFile.substring(location + problem.length, end);

						// Cut off the snippet before the first new line
						if (post.search(/\n/) !== -1) {
							post = post.substring(0, post.search(/\n/));
						}

						// Replace the problem with a placeholder so that we don't find it again
						fileString = fileString.substring(0, location) +
							placeholder('-', problem.length) +
							fileString.substring(location + problem.length);

						// Find the line number of the problem
						var newLines = referenceFile.substring(0, location).match(/\n/g);
						var lineNumber = (newLines) ? newLines.length + 1 : 1;

						report.messages.push({
							line: lineNumber,
							col: pre.length + 1,
							pre: pre,
							match: referenceFile.substring(location, location + problem.length),
							post: post,
							rule: rule
						});
					}
				}
			});
		}

		// send status down-stream
		file.patternlint = formatOutput(report, file, rules);

		cb(null, file);
	});
};

var defaultReporter = function (file) {
	var errorCount = file.patternlint.errorCount;
	var plural = (errorCount === 1) ? '' : 's';

	gutil.log(color.cyan(errorCount) + ' error' + plural +
		' found in ' + color.magenta(file.path));

	file.patternlint.results.forEach(function (result) {
		var message = result.error;
		gutil.log(
			color.red('[') +
			color.yellow('L' + message.line) +
			color.red(':') +
			color.yellow('C' + message.col) +
			color.red('] ') +
			'Excerpt: ' +
			color.cyan('"' + message.pre) +
			color.bgRed(message.match) +
			color.cyan(message.post + '"')
		);
		gutil.log(color.yellow(message.rule.message));
	});
};

patternLintPlugin.reporter = function (customReporter) {
	var reporter = defaultReporter;

	if (typeof customReporter === 'function') {
		reporter = customReporter;
	}

	if (typeof reporter === 'undefined') {
		throw new Error('gulp-patternlint: Invalid reporter');
	}

	return es.map(function (file, cb) {
		// Only report if Lint was run and errors were found
		if (file.patternlint && !file.patternlint.success) {
			reporter(file);
		}

		return cb(null, file);
	});
};

patternLintPlugin.failReporter = function () {
	return es.map(function (file, cb) {
		// Nothing to report or no errors
		if (!file.patternlint || file.patternlint.success) {
			return cb(null, file);
		}

		return cb(new gutil.PluginError('gulp-patternlint', 'Pattern Lint failed for ' + file.relative), file);
	});
};

module.exports = patternLintPlugin;
