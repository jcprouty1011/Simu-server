const express = require('express');
const {execSync} = require('child_process');
const app = express();
const sqlite = require('sqlite3');

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

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
  db.all('SELECT date, tasks_assigned, tasks_finished, time_assigned, time_finished FROM task_scores ORDER BY date DESC LIMIT 7', (error, rows) => {
    rows.forEach(row => {
      data.push([row.date, row.tasks_assigned, row.tasks_finished, row.time_assigned, row.time_finished]);
    });
    res.send(JSON.stringify({taskData: data}));
  });
});

app.listen(3001, () => {
  console.log("listening on port 3001");
});
