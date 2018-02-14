const crypto = require('crypto')
const AUTH_HEADER = 'x-hub-signature'
const SECRET = process.env.SECRET

module.exports = (req) => {
	const hubSig = req.header(AUTH_HEADER)

	if (!hubSig) {
		return false;
	}

	const blob = JSON.stringify(req.body)
	const hmac = crypto.createHmac('sha1', SECRET)
	const appSig = `sha1=${hmac.update(blob).digest('hex')}`
	const appBuffer = Buffer.from(appSig, 'utf8')
	const hubBuffer = Buffer.from(hubSig, 'utf8')

	const safe = crypto.timingSafeEqual(appBuffer, hubBuffer)

	if (safe) {
		return true
	}

	return false
}
