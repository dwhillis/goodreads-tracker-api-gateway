const secrets = require('./secrets.json');
Object.assign(process.env, secrets);
const app = require('./src/app');

app.listen(3000, () => {
    console.log('listening on port 3000');
});
