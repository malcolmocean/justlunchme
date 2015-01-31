var pg = require('pg');

pg.connect(process.env.DATABASE_URL || process.env.JUSTLUNCHME_PG_URL,  function(err, client) {
  err && console.log("err", err);
  console.log("client", client);
  var query = client.query('CREATE TABLE users (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100))');
  query.on('end', function() { client.end(); });
  // var query = client.query('SELECT * FROM your_table');

  // query.on('row', function(row) {
  //   console.log(JSON.stringify(row));
  // });
});

module.exports = {};
