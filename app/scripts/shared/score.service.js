(function() {
  'use strict';

  angular.module('appCore').factory('scoreService', scoreService);

  scoreService.$inject = ['$q', '$firebaseObject', '$firebaseRef', 'userService', 'APP_CONFIG'];

  function scoreService($q, $firebaseObject, $firebaseRef, userService, APP_CONFIG) {
    let rules = APP_CONFIG.rules;
    let exactResult;

    return {
      updateUserScores: updateUserScores
    };

    function updateUserScores(match) {
      // console.log('updateUserScores');
      return userService.getUserList()
      .then(resp => {
        if (match) {
          let users = resp.map(user => {
            // console.log('updateUserScores -> updateMatchScore: '+ user.name);
            return updateMatchScore(user, match);
          });

          return $q.all(users.map(user => {
            return userService.saveUser(user)
            .then(resp => {
              return $q.resolve(user);
            });
          }));
        }
        return $q.resolve(resp);
      })
      .then(users => {
        let usersWithTotalScore = users.map(user => {
          return getTotalScore(user);
        });

        return $q.all(usersWithTotalScore);
      })
      .then(users => {
        return $q.all(users.map(user => {
          return userService.saveUser(user);
        }));
      });
    }

    function updateMatchScore(user, match) {
      // console.log('updateMatchScore: ' + user.name)
      if (!user.bets || !user.bets.matches) {
        return user;
      }

      if (user.bets.matches[match.$id] && match.result) {
        // console.log('points = calculateScore');
        user.bets.matches[match.$id].points = calculateScore(user, match.result, user.bets.matches[match.$id]);
        user.bets.matches[match.$id].exactResult = exactResult;

      } else if (user.bets.matches[match.$id]) {
        // console.log('points = null');
        user.bets.matches[match.$id].points = null;
      }

      return user;
    }

    /* BOLAO REGRAS
    -------------------------------------------
    15 pontos Placar Exato com 5 ou mais gols na partida OK
    12 pontos Placar Exato OK
    9 pontos Placar do Vencedor OK
    7 pontos Empate Incorreto OK
    6 pontos Placar do Perdedor OK
    4 pontos Diferença de gols OK
    3 pontos Acertar o vencedor da partida sem nenhuma das combinações acima OK
    */

    function calculateScore(user, result, bet) {
      // console.log('calculateScore', user);
      let score = 0;
      let matchScore = 0;
      exactResult = false;
      
      if (bet) {
        let matchWinner = decideWinner(result);
        let betWinner = decideWinner(bet);
        let matchLoser = decideLoser(result);
        let betLoser = decideLoser(bet);
        
        matchScore = parseInt(bet.home) + parseInt(bet.away);
        // matchScore = parseInt(bet.home) + parseInt(bet.away);
        // console.log('matchWinner', matchWinner, 'betWinner', betWinner)
        // console.log('matchLoser', matchLoser, 'betLoser', betLoser)
        // console.log('matchScore', matchScore, bet.home, bet.away);

        if (matchWinner === betWinner) {
          //Acerto do resultado (vitoria / empate) = 3 pontos
          console.log('result');
          score += rules.result;

        } 
        if (result.home === bet.home && result.away === bet.away) {
          //Acerto do placar cravado = 12 ou 15 (mais de X gols rules.matchScore)
          console.log('exactResult', score);
          score += matchScore >= rules.matchBonusGoals ? rules.exactResult + rules.exactResultBonus : rules.exactResult;
          exactResult = true;
        }
        //if (matchWinner != 'draw' && 
        if (matchWinner != 'draw' && exactResult === false){
          //Resultado não é empate
          console.log('NOT draw');

          if (matchWinner === betWinner && ((result.home - result.away) === (bet.home - bet.away))) {
            //Acerto da diferença de gols (com exceção ao empate) = 4 (3+1) 
            console.log('diffScore');
            score += rules.resultDifScore
  
          };
          console.log('placar', result[matchWinner], bet[matchWinner]);
          if (matchWinner === betWinner && result[matchLoser][0] === bet[matchLoser][0]) {
            //Acerto do placar do perdedor = 6 (3+3)
            console.log('loserScore');
            score += rules.loserScore;
          }
          if (matchWinner === betWinner && result[matchWinner][0] === bet[matchWinner][0]) {
            //Acerto do placar do vencedor = 9 (6+3)
            console.log('winnerScore');
            score += rules.winnerScore;
          }
        }else{
          //Resultado é empate
          if (exactResult === false && decideWinner(result)==='draw' && decideWinner(bet)==='draw') {
            console.log('incorrect draw');
            score += rules.resultDraw
          }
        }
        // console.log('result casa: '+ result.home + 'x palpite casa: ' + bet.home);
        // console.log('result visitante: ' + result.away + 'x palpite visitante: ' + bet.away);

        console.log('total score: ' + score);
      }

      return score;
    }

    function decideWinner(result) {
      let winner;

      if (result.home > result.away) {
        winner = 'home';
      } else if (result.home < result.away) {
        winner = 'away';
      } else {
        winner = 'draw';
      }

      return winner;
    }
    function decideLoser(result) {
      let loser;

      loser = decideWinner(result) === 'home' ? 'away' : 'home';

      return loser;
    }

    function getTotalScore(user) {
      if (!user.uid) {
        let error = new Error(user + ' não tem uid!');
        return $q.reject(error);
      }

      return userService.getUserMatchBets(user.uid)
      .then(matches => {
        let score = matches.reduce((prev, cur) => {
          if (cur.points) {
            prev += cur.points;
          }
          return prev;
        }, 0);
        let extraScore = user.extraPoints || 0;
        user.totalScore = score + extraScore;
        
        //Atualiza total de cravadas para fins e desempate
        let exactResults = matches.reduce((prev, cur) => {
          if (cur.exactResult) {
            prev++;
          }
          return prev;
        }, 0);
        user.exactResults = exactResults;

        return $q.resolve(user);
      });
    }
  }
})();