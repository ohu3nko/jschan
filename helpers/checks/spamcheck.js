'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, { Posts } = require(__dirname+'/../../db/')
	, timeUtils = require(__dirname+'/../timeutils.js')

module.exports = async (req, res) => {

	if (res.locals.permLevel <= 1) { //global staff bypass spam check
		return false;
	}

	const now = Date.now();
	const last120id = Mongo.ObjectId.createFromTime(Math.floor((now - (timeUtils.MINUTE*2))/1000));
	const last30id = Mongo.ObjectId.createFromTime(Math.floor((now - (timeUtils.MINUTE*0.5))/1000));
	const last5id = Mongo.ObjectId.createFromTime(Math.floor((now - 5000)/1000));
	const ors = [];
	const contentOr = [];
	if (res.locals.numFiles > 0) {
		contentOr.push({
			'files': {
				'$elemMatch': {
					'hash': { //any file hash will match, doesnt need to be all
						'$in': req.files.file.map(f => f.sha256)
					}
				}
			}
		});
	}
	if (req.body.message) {
		contentOr.push({
			'nomarkup':  req.body.message
		})
	}
	//matching content from any IP in the past 30 seconds
	ors.push({
		'_id': {
			'$gt': last30id
		},
		'$or': contentOr
	});
	//matching content from same IP in last 2 minutes
	ors.push({
		'_id': {
			'$gt': last120id
		},
		'ip.single': res.locals.ip.single,
		'$or': contentOr
	});
	//any posts from same IP in past 5 seconds TODO: make this just use a redis key of IP and expire after 5 seconds
	ors.push({
		'_id': {
			'$gt': last5id
		},
		'ip.single': res.locals.ip.single
	})

	let flood = await Posts.db.find({
		'$or': ors
	}).toArray();

	return flood.length > 0;

}
