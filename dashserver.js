const express = require('express');
const {execSync} = require('child_process');
const app = express();
const sqlite = require('sqlite3');

function formatDate(date) {
  let datePiece = String(date.getDate());
  let monthPiece = String(Number(date.getMonth()) + 1);
  const yearPiece = date.getFullYear();
  if (datePiece.length === 1) {
    datePiece = '0' + datePiece;
  }
  if (monthPiece.length === 1) {
    monthPiece = '0' + monthPiece;
  }
  return yearPiece + "-" + monthPiece + "-" + datePiece;
}

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'content-type');
  next();
});
app.use(express.json());

app.get('/', (req, res, next) => {
  res.send('Dashboard backend is running on this port.');
});

app.get('/taskdata', (req, res, next) => {
  console.log('Running applescript to update task data.')
  execSync('osascript /Users/jcprouty/scripts/current_task_percentage.scpt');
  console.log('Sending update to the client.');
  const rawText = String(execSync('cat /Users/jcprouty/scripts/current_task_percentage.txt'));
  const textArray = rawText.split(',');
  const percentage = Number(textArray[2]) / Number(textArray[3]);
  res.send(String(percentage));
});

app.get('/weektaskdata', (req, res, next) => {
  console.log('Sending week\'s task data');
  const db = new sqlite.Database('/Users/jcprouty/scripts/personaldata.db');
  const data = [];
  db.all('SELECT date, tasks_assigned, tasks_finished, time_assigned, time_finished FROM new_task_scores ORDER BY id DESC LIMIT 7', (error, rows) => {
    rows.forEach(row => {
      data.push([row.date, row.tasks_assigned, row.tasks_finished, row.time_assigned, row.time_finished]);
    });
    res.send(JSON.stringify({taskData: data}));
  });
});

app.get('/generaldatatypes', (req, res, next) => {
  console.log('Sending general data types');
  const db = new sqlite.Database('/Users/jcprouty/scripts/personaldata.db');
  let removeRows = [];
  const date = new Date();
  const dateString = formatDate(date);
  //WHERE date=date(\'${dateString}\')
  db.get(`SELECT * FROM data_tracking `, (error, row) => {
    if (row) {
      for (let key in row) {
        if (row[key] === 0 || row[key]) {
          removeRows.push(key)
        }
      }
    }
    db.all('SELECT data, label FROM data_types', (error, rows) => {
      let keptRows = [];
      for (row of rows) {
        if (!removeRows.includes(row.data)) {
          keptRows.push(row);
        }
      }
      res.send(JSON.stringify(keptRows));
    });
  });
});

app.post('/postdatum', (req, res, next) => {
  console.log('Received a post request.');
  const db = new sqlite.Database('/Users/jcprouty/scripts/personaldata.db');
  if (req.body.dbKey) {
    const date = new Date();
    const dateString = formatDate(date);
    db.get(`SELECT id FROM data_tracking WHERE date=date(\'${dateString}\')`, (error, row) => {
      if (!row) {
        db.run(`INSERT INTO data_tracking (date, ${req.body.dbKey}) VALUES (\'${dateString}\', ${req.body.value})`, error => {
          res.status(201).send();
        });
      } else {
        db.run(`UPDATE data_tracking SET ${req.body.dbKey}=${req.body.value} WHERE date=date(\'${dateString}\')`, error => {
          res.status(201).send();
        });
      }
    });
  } else {
    console.log("Failed with this body:");
    console.log(req.body);
    res.status(500).send();
  }
});

app.listen(3001, () => {
  console.log("listening on port 3001");
});
