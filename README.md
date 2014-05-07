# gulp-patternlint [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url]

Pattern Lint is a generic plugin for linting any set of files for patterns, specified as either strings or regular expressions.

This can be used to enforce project-specific guidelines or team-specific practices on files in your projects, or anything that's too specific for more general, filetype-specific linters.

## Usage

First, install `gulp-patternlint` as a development dependency:

```shell
npm install --save-dev gulp-patternlint
```

Then, add it to your `gulpfile.js`:

```javascript
var patternlint = require('gulp-patternlint');

gulp.task('js', function () {
	gulp.src('src/js/*.js')
		.pipe(patternlint())
		.pipe(patternlint.reporter());
});
```

## API

### Rule Configuration

You can pass rules as an array of objects.

```javascript
gulp.task('javascript', function () {
	return gulp.src('src/js/main.js')
	.pipe(patternLint([{
		message: 'Don\'t leave any console statements in your JS.',
		pattern: 'console'
	}, {
		message: 'Use the protocol-independent // instead of http or https.',
		regexp: '(http://|https://)'
	}]))
	...
});
```

#### Strings

`String`s should be specified as the `pattern` property.

#### Regular Expressions

Regular expressions should be specified as the `regexp` property. Please leave off the opening and closing slashes.

You can also add a flags property to specify [additional regular expression flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Advanced_Searching_With_Flags). There is no need to add g: all rules get searched for globally.

```javascript
gulp.task('javascript', function () {
	return gulp.src('src/js/main.js')
	.pipe(patternLint({
		message: 'Use the protocol-independent // instead of http or https.',
		regexp: '(http://|https://)',
		flags: 'i' // make the search case-insensitive
	}))
	...
});
```

### patternlintrc
Type: `String`

If no rules array is passed in, Pattern Lint will look for `.patternlintrc` in the root of your project, where you can specify the rules as JSON (double-quotes, please). You can pass in a string to use a different rules file.

```javascript
gulp.src('client/css/*.css')
	.pipe(patternlint('bestpractices.json'))
	.pipe(patternlint.reporter());
```

## Results

Adds the following properties to the file object:

```javascript
file.patternlint.success = true; // or false
file.patternlint.errorCount = 0; // number of errors returned by PatternLint
file.patternlint.results = []; // PatternLint errors
file.patternlint.rules = {}; // The rules you passed to PatternLint
```

## Custom Reporters

Pattern Lint has a lovely default reporter that sends output to your gulp process with information about linting problems. But if you'd like to make your own, custom reporter functions can be passed as `patternlint.reporter(reporterFunc)`. The reporter function will be called for each linted file and passed the file object as described above.

```javascript
var patternlint = require('gulp-patternlint');
var gutil = require('gulp-util');

var customReporter = function (file) {
	gutil.log(gutil.colors.cyan(file.patternlint.errorCount) + ' errors in ' + gutil.colors.magenta(file.path));

	file.patternlint.results.forEach(function (result) {
		/*
		 * The error object has these properties:
		 * line: the line number of the error
		 * col: the column number of the error
		 * pre: an excerpt of the file that preceded the error,
		   no longer than 25 characters
		 * match: the text of the file that produced the error
		 * post: an excerpt of the file that followed the error,
		   no longer than 25 characters
		 * message: the rule's message (ie, "Don't use the word
		   irregardless. Because it's not a word.")
		 */
		gutil.log(result.error.message + ' on line ' + result.error.line);
	});
};

gulp.task('lint', function () {
	gulp.files('lib/*.css')
		.pipe(patternlint())
		.pipe(patternlint.reporter(customReporter));
});
```

## Acknowledgements

This plugin is almost a fork of [@lazd](https://github.com/lazd)'s [gulp-csslint](https://github.com/lazd/gulp-csslint) plugin, which I used as a model to learn how to write a Gulp plugin.

[travis-url]: http://travis-ci.org/neagle/gulp-patternlint
[travis-image]: https://secure.travis-ci.org/neagle/gulp-patternlint.png?branch=master
[npm-url]: https://npmjs.org/package/gulp-patternlint
[npm-image]: https://badge.fury.io/js/gulp-patternlint.png
