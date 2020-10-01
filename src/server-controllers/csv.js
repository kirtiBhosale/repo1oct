/* eslint-disable */
// import { db, pgp } from './database';

const pgoptions = {
  connect(client, dc, isFresh) {
    if (isFresh) {
      client.on('notice', (msg) => {
        console.log('notice: ', msg);
      });
    }
  },
  query(e) {
    console.log(e.query);
  },
};

const pgp = require('pg-promise')(pgoptions);


const conString =`${process.env.DATABASE_URL}?ssl=${process.env.SSLEnabled}`;
const db = pgp(conString);

const csvFilePath = './sample.csv';
const csv = require('csvtojson');

// Generating 10,000 records 1000 times, for the total of 10 million records:
async function getNextData(t, pageIndex) {
  const jsonArray = await csv().fromFile(csvFilePath);
 
  let data = null;

  console.log('jsonArray.length / 10000', jsonArray.length / 10000);
  if (pageIndex <= jsonArray.length / 10000) {
    data = [];
    for (let i = 0; i < 10000 && ((pageIndex * 10000) + i < jsonArray.length); i++) {
      const idx = (pageIndex * 10000) + i;
    
      data.push({
        id: jsonArray[idx].id,
        name: jsonArray[idx].name,
        notes: jsonArray[idx].notes,
      });
    }
  }
  return Promise.resolve(data);
}

function migrate() {
  
  // Creating a reusable/static ColumnSet for generating INSERT queries:
  const cs = new pgp.helpers.ColumnSet([
    'id',
    'name',
    'notes',
  ], { table: 'temp' });
  db.any('truncate table temp').then(() => {
      
    db.tx('massive-insert', (t) => {
      return t.sequence((index) => {
        return getNextData(t, index)
        // eslint-disable-next-line consistent-return
          .then((data) => {
            if (data) {
              const insert = pgp.helpers.insert(data, cs);
              return t.none(insert);
            }
          });
      });
    })
      .then((data) => {
      // COMMIT has been executed
      console.log("=====dis")
      global.io.sockets.emit("disconnect")
      console.log('Total batches:', data.total, ', Duration:', data.duration);
     
      })
      .catch((error) => {
      // ROLLBACK has been executed
        console.log(error);
       
      });
  }).catch((err) => {
    console.log(err);
 
  });
}

module.exports = {
  migrate,
};
