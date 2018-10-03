/**
 * http://usejsdoc.org/
 */

const fs = require('fs');
const child_process = require('child_process');

class ffmpeg {
	constructor(options) {
		this.options = options;
	}

	record(input, filepath, logpath, overwrite = true) {
		let args = this.getCommand(input);

		// if (overwrite) {
		// 	args.push('-y');
		// }
		args.push(filepath);

		return this.exec(args, logpath);
	}

	mergeRecords(inputCollection, filepath, logpath, overwrite = false) {
		let args = this.getCommandMerge(inputCollection);
		args.push(filepath);

		return this.exec(args, logpath);
	}

	publish(input, rtmpUrl, logpath) {
		let args = this.getCommand(input);
		args.push('-f', 'flv');
		args.push(rtmpUrl);

		return this.exec(args, logpath);
	}

	exec(args, logpath) {
		let exe = this.options.path ? this.options.path : 'ffmpeg';
		let process = child_process.spawn(exe, args);

		if (logpath) {
			let log = fs.createWriteStream(logpath);

			process.stdout.on('data', (data) => {
				let message = data.toString('utf8');
				log.write(message);
			});

			process.stderr.on('data', (data) => {
				let message = data.toString('utf8');
				log.write(message);
			});

			process.on('exit', (code, signal) => {
				log.end();
			});
		}

		return process;
	}

	getCommand(input) {
		let args = [
			'-probesize', '2147483647',
			'-analyzeduration', '2147483647',
			'-i', input,
			'-threads', '20',
			'-vcodec', 'libx264',
			'-strict', '-2'
		];

		if (this.options.enableDebug) {
			args.push('-loglevel', 'debug');
		}

		return args;
	}

	getCommandMerge(inputCollection) {
		let args = [
			'-probesize', '2147483647',
			'-analyzeduration', '2147483647',
		];
		args.push('-i');
		args.push(inputCollection[0].stream);
		for (var i = 1; i < inputCollection.length; i++) {
			args.push('-itsoffset');
			args.push(inputCollection[i].offSet + 1);
			console.log("OffSet: " + inputCollection[i].offSet + 1);
			args.push('-i');
			args.push(inputCollection[i].stream);
			console.log("File: " + inputCollection[i].stream);

		}

		for (var p = 0; p < inputCollection.length; p++) {
			args.push("-map");
			args.push(p);
		}
		// args.push("-codec");
		// args.push("copy");
		// args.push("-vcodec");
		// args.push("libx264");
		// args.push("-acodec");
		// args.push("aac");
		args.push('-strict');
		args.push('-2');

		if (this.options.enableDebug) {
			args.push('-loglevel', 'debug');
		}

		return args;
	}
}

module.exports = ffmpeg;