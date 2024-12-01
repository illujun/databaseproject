const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 3000;

// MySQL 연결 설정
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tkdwnsdkdlel1!', // MySQL 비밀번호
  database: 'soccer_database' // 데이터베이스 이름
});

// MySQL 연결
db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

// Body-parser 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 정적 파일 제공
app.use(express.static(__dirname));

// 리그 추가 API
app.post('/addLeague', (req, res) => {
  const { leagueName, country } = req.body;

  const sql = 'INSERT INTO league (leagueName, country) VALUES (?, ?)';
  db.query(sql, [leagueName, country], (err, result) => {
    if (err) {
      res.status(500).send('Error adding league');
      console.error(err);
      return;
    }
    res.send('League added successfully!');
  });
});

// 팀 추가 API
app.post('/addTeam', (req, res) => {
  const { leagueID, stadiumID, manager, teamName, founded } = req.body;

  const sql = 'INSERT INTO team (leagueID, stadiumID, manager, teamName, founded) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [leagueID, stadiumID, manager, teamName, founded], (err, result) => {
    if (err) {
      res.status(500).send('Error adding team');
      console.error(err);
      return;
    }
    res.send('팀이 성공적으로 추가되었습니다!');
  });
});
// 선수 추가 API
app.post('/addPlayer', (req, res) => {
  const { teamID, playerName, birth, nation, position } = req.body;

  const sql = 'INSERT INTO players (teamID, playerName, birth, nation, position) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [teamID, playerName, birth, nation, position], (err, result) => {
    if (err) {
      res.status(500).send('Error adding player');
      console.error(err);
      return;
    }
    res.send('플레이어가 성공적으로 추가되었습니다!');
  });
});

// 경기 추가 API
app.post('/addMatch', (req, res) => {
  const { stadiumID, homeTeamID, awayTeamID, matchDate, homeScore, awayScore, attendance } = req.body;

  // 테이블과 컬럼 이름을 명확히 지정
  const sql = `
    INSERT INTO matches (stadiumID, homeTeamID, awayTeamID, matchDate, homeScore, awayScore, attendance)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  db.query(sql, [stadiumID, homeTeamID, awayTeamID, matchDate, homeScore, awayScore, attendance], (err, result) => {
    if (err) {
      res.status(500).send('Error adding match');
      console.error(err);
      return;
    }
    res.send('Match added successfully!');
  });
});


// 경기 세부 정보 추가 API
app.post('/addMatchDetail', (req, res) => {
  const { matchID, playerID, actionType, actionTime } = req.body;

  const sql = `
        INSERT INTO matchaction (matchID, playerID, actionType, actionTime)
        VALUES (?, ?, ?, ?)
    `;
  db.query(sql, [matchID, playerID, actionType, actionTime], (err, result) => {
    if (err) {
      res.status(500).send('Error adding match detail');
      console.error(err);
      return;
    }
    res.send('메치 세부 정보가 등록되었습니다!');
  });
});

// 리그 순위 조회
app.get('/viewRankings', (req, res) => {
  const sql = `
    SELECT
      lr.teamRank AS ranking,
      t.teamName,
      l.leagueName,
      ts.points,
      ts.wins,
      ts.draws,
      ts.losses,
      ts.goalsFor,
      ts.goalsAgainist
    FROM leagueranking lr
           INNER JOIN team t ON lr.teamID = t.teamID
           INNER JOIN league l ON lr.leagueID = l.leagueID
           INNER JOIN teamstats ts ON lr.teamID = ts.teamID
    ORDER BY lr.teamRank ASC;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching league rankings');
      console.error(err);
      return;
    }
    res.json(results);
  });
});


// 팀 세부 기록 조회 API
app.get('/viewTeamDetails', (req, res) => {
  const { teamID } = req.query;

  const sql = `
    SELECT
      t.teamName,
      ts.wins,
      ts.draws,
      ts.losses,
      ts.goalsFor,
      ts.goalsAgainist,
      ts.points
    FROM teamstats ts
           INNER JOIN team t ON ts.teamID = t.teamID
    WHERE t.teamID = ?;
  `;

  db.query(sql, [teamID], (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).send('Error fetching team details');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('No team details found');
      return;
    }

    res.json(results);
  });
});


// 선수 세부 기록 조회 API
app.get('/viewPlayerDetails', (req, res) => {
  const { playerID } = req.query;

  console.log('Received playerID:', playerID); // 요청된 playerID 로그

  const sql = `
    SELECT
      p.playerName,
      ps.goals,
      ps.assists,
      ps.yellowcard,
      ps.redcard
    FROM playerstats ps
           INNER JOIN players p ON ps.playerID = p.playerID
    WHERE p.playerID = ?;
  `;

  db.query(sql, [playerID], (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err); // 쿼리 에러 로그
      res.status(500).send('Error fetching player details');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('No player details found');
      return;
    }

    res.set('Cache-Control', 'no-store'); // 캐싱 방지
    console.log('SQL Query Results:', results); // SQL 결과 로그
    res.json(results); // JSON 형식으로 결과 반환
  });
});

// 팀 목록 가져오기 API
app.get('/getTeams', (req, res) => {
  const sql = 'SELECT teamID, teamName FROM team';
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching teams');
      console.error(err);
      return;
    }
    res.json(results);
  });
});
// 스타디움 목록 가져오기 API
app.get('/getStadiums', (req, res) => {
  const sql = 'SELECT stadiumID, stadiumName FROM stadium';
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching stadiums');
      console.error(err);
      return;
    }
    res.json(results);
  });
});
// 리그 목록 가져오기 API
app.get('/getLeagues', (req, res) => {
  const sql = 'SELECT leagueID, leagueName FROM league';
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching leagues');
      console.error(err);
      return;
    }
    res.json(results);
  });
});
// 선수 목록 가져오기 API
app.get('/getPlayers', (req, res) => {
  const sql = 'SELECT playerID, playerName FROM players';
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching players');
      console.error(err);
      return;
    }

    res.set('Cache-Control', 'no-store'); // 캐싱 방지
    res.json(results);
  });
});
// 경기 목록 가져오기 API
app.get('/getMatches', (req, res) => {
  const sql = `
        SELECT matchID,
               CONCAT(home.teamName, ' vs ', away.teamName, ' on ', matchDate) AS matchInfo
        FROM matches
        INNER JOIN team AS home ON matches.homeTeamID = home.teamID
        INNER JOIN team AS away ON matches.awayTeamID = away.teamID
    `;
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching matches');
      console.error(err);
      return;
    }
    res.json(results);
  });
});

// 경기 세부 정보 조회
app.get('/getMatchesDetailed', (req, res) => {
  const sql = `
    SELECT
      matches.matchID,
      home.teamName AS homeTeam,
      away.teamName AS awayTeam,
      matches.matchDate,
      matches.homeScore,
      matches.awayScore,
      matches.attendance
    FROM matches
           INNER JOIN team AS home ON matches.homeTeamID = home.teamID
           INNER JOIN team AS away ON matches.awayTeamID = away.teamID;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching matches');
      console.error(err);
      return;
    }
    res.json(results);
  });
});

app.get('/viewTeamDetails', (req, res) => {
  const { teamID } = req.query; // 요청에서 teamID를 가져옴

  const sql = `
    SELECT
      t.teamName,
      ts.wins,
      ts.draws,
      ts.losses,
      ts.goalsFor,
      ts.goalsAgainist,
      ts.points
    FROM teamstats ts
           INNER JOIN team t ON ts.teamID = t.teamID
    WHERE t.teamID = ?;
  `;

  db.query(sql, [teamID], (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).send('Error fetching team details');
      return;
    }

    console.log('SQL Query Results:', results); // SQL 결과 확인
    res.json(results); // JSON 형식으로 결과 반환
  });
});


app.get('/viewPlayerDetails', (req, res) => {
  const { playerID } = req.query;

  const sql = `
    SELECT
      p.playerName,
      ps.goals,
      ps.assists,
      ps.yellowcard,
      ps.redcard
    FROM playerstats ps
           INNER JOIN players p ON ps.playerID = p.playerID
    WHERE p.playerID = ?;
  `;

  db.query(sql, [playerID], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching player details');
      console.error(err);
      return;
    }
    res.json(results);
  });
});


// 서버 실행
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
