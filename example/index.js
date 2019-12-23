const ntp = require('..');

ntp({server: 'pool.ntp.org'}, function(err, response){
  if(err) return console.error(err);
  console.log(response);
});
