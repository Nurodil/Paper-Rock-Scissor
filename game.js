const crypto = require('crypto');

class MoveRules {
  constructor(moves) {
    this.moves = moves;
    this.numMoves = moves.length;
    this.rules = this.generateRules();
  }

  generateRules() {
    const rules = {};

    for (let i = 0; i < this.numMoves; i++) {
      const currentMove = this.moves[i];
      const nextHalf = this.moves.slice(i + 1, i + 1 + this.numMoves / 2);
      const prevHalf = this.moves.slice(i - Math.floor(this.numMoves / 2), i);

      rules[currentMove] = {
        wins: nextHalf,
        loses: prevHalf,
      };
    }

    return rules;
  }

  determineWinner(playerMove, computerMove) {
    if (playerMove === computerMove) {
      return 'draw';
    }

    const playerWins = this.rules[playerMove].wins.includes(computerMove);

    return playerWins ? 'player' : 'computer';
  }
}

class HelpTable {
  constructor(moves) {
    this.moves = moves;
    this.numMoves = moves.length;
  }

  generateTable() {
    const table = [['Moves', ...this.moves]];

    for (let i = 0; i < this.numMoves; i++) {
      const row = [this.moves[i]];

      for (let j = 0; j < this.numMoves; j++) {
        const result = this.determineResult(this.moves[i], this.moves[j]);
        row.push(result);
      }

      table.push(row);
    }

    return table;
  }

  determineResult(move1, move2) {
    if (move1 === move2) {
      return 'Draw';
    }

    const game = new MoveRules(this.moves);
    const winner = game.determineWinner(move1, move2);

    if (winner === 'player') {
      return 'Win';
    } else {
      return 'Lose';
    }
  }
}

class Game {
  constructor(moves) {
    this.moves = moves;
    this.key = this.generateKey();
    this.computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
  }

  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  computeHMAC(move) {
    const hmac = crypto.createHmac('sha256', this.key);
    hmac.update(move);
    return hmac.digest('hex');
  }

  displayMoves() {
    console.log('Available moves:');
    this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
    console.log('0 - exit');
    console.log('? - help');
  }

  getUserMove() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question('Enter your move: ', (move) => {
        readline.close();
        resolve(move);
      });
    });
  }

  showResult(playerMove) {
    console.log(`Your move: ${playerMove}`);
    console.log(`Computer move: ${this.computerMove}`);

    const moveRules = new MoveRules(this.moves);
    const winner = moveRules.determineWinner(playerMove, this.computerMove);

    if (winner === 'draw') {
      console.log('It\'s a draw!');
    } else if (winner === 'player') {
      console.log('You win!');
    } else {
      console.log('You lose!');
    }

    console.log(`HMAC key: ${this.key}`);
  }

  async play() {
    console.log(`HMAC: ${this.computeHMAC(this.computerMove)}`);
    this.displayMoves();

    while (true) {
      const userMove = await this.getUserMove();

      if (userMove === '0') {
        break;
      } else if (userMove === '?') {
        const helpTable = new HelpTable(this.moves);
        const table = helpTable.generateTable();
        console.log('Help Table:');
        for (let i = 0; i < table.length; i++) {
          console.log(table[i].join('\t'));
        }
      } else if (isNaN(userMove) || userMove < 1 || userMove > this.moves.length) {
        console.log('Invalid input. Please try again.');
        this.displayMoves();
      } else {
        const playerMove = this.moves[userMove - 1];
        this.showResult(playerMove);
      }
    }

    console.log('Goodbye!');
  }
}

function validateArguments(args) {
  if (args.length < 3 || args.length % 2 === 0 || new Set(args).size !== args.length) {
    console.log('Invalid arguments. Please provide an odd number >= 3 of non-repeating strings.');
    console.log('Example: node game.js rock paper scissors lizard Spock');
    return false;
  }

  return true;
}

function main() {
  const args = process.argv.slice(2);

  if (!validateArguments(args)) {
    process.exit(1);
  }

  const moves = args;
  const game = new Game(moves);
  game.play();
}

main();
