const sqlite = require('sqlite3');
const db = new sqlite.Database('/Users/jcprouty/scripts/personaldata.db');

let counter = 0;
const rows = [];
db.serialize( () => {
  db.each('SELECT * FROM task_scores', (error, row) => {
    rows.push(row);
  });

  console.log(rows.length);
  for (let rowId = 0; rowId < rows.length; rowId ++) {
    const rowObject = {
      $id: Number(rowId + 1),
      $date: rows[rowId].date,
      $tasks: rows[rowId].tasks_assigned,
      $finished: rows[rowId].tasks_finished,
      $time: rows[rowId].time_assigned,
      $timeFinshed: rows[rowId].time_finished
    };
    db.run('UPDATE task_scores SET id=6', rowObject, (error) => {
      console.log(error.message);
    });
  }
});
// WHERE date=$date AND tasks_assigned = $tasks AND tasks_finished = $finished AND time_assigned = $time AND time_finished = $timeFinished
