module.exports = {
	build: `tsc`,
	prepare: [
		`@clean`,
		`@build`
	],
	clean: [
		`rm -rf lib`
	],
	test: ``,
	echo: `echo something`
};

module.exports.description = {};