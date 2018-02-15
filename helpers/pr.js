const request = require('request-promise-native')
const winston = require('winston')
const moment = require('moment')

winston.add(winston.transports.File, { filename: 'error.log' })
winston.remove(winston.transports.Console)

// github needs a user agent in the request, setting as app name
const userAgent = {
	'User-Agent': process.env.APP_NAME
}

const prep = (pr) => {
    // only handle if the PR has been merged
		if (pr.merged) {
			// release request options
			const options = {
				method: 'GET',
				uri: getReleasesUrl(pr.repo.url),
				headers: userAgent,
				json: true
			}

			// make request to releases end pt
			request(options)
				.then((data) => handleReleases(data, pr)) // success
				.catch((err) => { winston.error(err) }) // failed
		}
}

const getReleaseUrl = (repoUrl, releaseId) => (`${repoUrl}/releases/${releaseId}?access_token=${process.env.GH_TOKEN}`)

const getReleasesUrl = (repoUrl) => (`${repoUrl}/releases?access_token=${process.env.GH_TOKEN}`)

const handleReleases = (data, pr) => {
	// the first item in the data should be the most recent release
	const release = data.length ? data[0] : null
	// if there's a release draft, append the line item
	if (release && release.draft) {
		editRelease(release, pr)
	}

	// if there are no releases or the release is not a draft, create a new release
	if (!release || (release && !release.draft)) {
		createRelease(pr)
	}
}

const editRelease = (release, pr) => {
	const releaseUrl = getReleaseUrl(pr.repo.url, release.id)
	const prDesc = getPrDesc(pr)
	const updatedbody = `${release.body}\n${prDesc}`

	const options = {
		method: 'PATCH',
		uri: releaseUrl,
		headers: userAgent,
		body: {
			body: updatedbody // setting to the updated body with new line
		},
		json: true
	}

	// make PATCH request to create new release
	request(options)
		// .then((data) => { console.log('edit release', data) })
		.catch((err) => { winston.error(err) })
}

const getPrDesc = ({ number, title }) => (`- ${title} (#${number})`)

const createRelease = (pr) => {
	// line item formatted as "PR_Title (#PR_number)"
	const prDesc = getPrDesc(pr)
	const newRelease = {
		name: 'NEXT RELEASE',
		draft: true, // set to true so it doesn't auto publish,
		prerelease: false,
		body: prDesc,
		tag_name: 'UNTAGGED'
	}

	const options = {
		method: 'POST',
		uri: getReleasesUrl(pr.repo.url),
		headers: userAgent,
		body: newRelease,
		json: true
	}

	request(options)
		// .then((data) => { console.log('create release', data) })
		.catch((err) => { winston.error(err) })
}

module.exports = {
	prep
}
