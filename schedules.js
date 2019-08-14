'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const { stat, remove, readdir } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/helpers/files/uploadDirectory.js')
	, msTime = require(__dirname+'/helpers/mstime.js')
	, Mongo = require(__dirname+'/db/db.js')

async function deleteCaptchas() {
	const files = await readdir(`${uploadDirectory}captcha/`);
	if (files.length > 0) {
		files.forEach(async (file) => {
			try {
				const filePath = `${uploadDirectory}captcha/${file}`;
				const stats = await stat(filePath);
				const now = Date.now();
				const expiry = new Date(stats.ctime).getTime() + msTime.minute*5;
				if (now > expiry) {
					await remove(filePath);
					console.log(`Deleted expired captcha ${filePath}`)
				}
			} catch (e) {
				console.error(e);
			}
		});
	}
}

(async () => {

	await Mongo.connect();
	const { buildHomepage } = require(__dirname+'/helpers/build.js')
		, Files = require(__dirname+'/db/files.js');

	console.log('Starting schedules');

	setInterval(async () => {
		try {
			await buildHomepage();
		} catch (e) {
			console.error(e);
		}
	}, msTime.minute*5); //rebuild homepage for pph updates

	//could make this use a db changefeed
	setInterval(async () => {
		try {
			await deleteCaptchas();
		} catch (e) {
			console.error(e);
		}
	}, msTime.minute*5); //delete files for expired captchas

	setInterval(async () => {
		try {
//todo: would need to lock the DB or at least disable posting very shortly for this pruning
			const files = await Files.db.find({
				'count': {
					'$lte': 0
				}
			}, {
				'count': 0
			}).toArray().then(res => {
				return res.map(x => x._id);
			});
			await Files.db.removeMany({
				'count': {
					'$lte': 0
				}
			});
			await Promise.all(files.map(async filename => {
				return Promise.all([
					remove(`${uploadDirectory}img/${filename}`),
					remove(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`)
				])
			}));
			console.log('Deleted unused files:', files);
		} catch (e) {
			console.error(e);
		}
	}, msTime.day);

})();
