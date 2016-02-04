var ipc = require('ipc');

ipc.on('db-updated', function(arg) {
  console.log(arg);
});
ipc.send('connection', 'ping');
