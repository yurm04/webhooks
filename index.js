const app = require('express')();
const https = require('https');
const bodyParser = require('body-parser');
const auth = require('./helpers/auth');
const prep = require('./helpers/pr').prep;

const PORT = process.env.NODE_PORT || 8080;

app.use(bodyParser.json());

app.get('/', (req, res) => {
	return res.status(200).send('BOOMSHAKALAKA');
});

// required by departures
app.get('/ping', (req, res) => {
	return res.status(200).send('OK');
});

app.post('/webhooks', (req, res) => {
	// authenticate
	if (!auth(req)) {
		return res.status(403).send('Go Away.');
	}

	const body = req.body;
	const keys = Object.keys(body);

	// if there's PR data, we want to prep it for release
	if (keys.includes('pull_request')) {
		const pr = body.pull_request;

		// add additional data to the pr object
		pr.number = body.number;
		pr.repo = body.repository;
		prep(pr);
	}

	return res.status(200).send('webhooks');
});


app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`)
});
