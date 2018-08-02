(function() {
  'use strict';

  angular.module('appCore').factory('scoreService', scoreService);

  scoreService.$inject = ['$q', '$firebaseObject', '$firebaseRef', 'userService', 'APP_CONFIG'];

  function scoreService($q, $firebaseObject, $firebaseRef, userService, APP_CONFIG) {
    let rules = APP_CONFIG.rules;

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
        user.bets.matches[match.$id].points = calculateScore(match.result, user.bets.matches[match.$id]);
      } else if (user.bets.matches[match.$id]) {
        // console.log('points = null');
        user.bets.matches[match.$id].points = null;
      }

      return user;
    }

    /* BOLAO REGRAS
    -------------------------------------------
    5 = acerto placar
    3 = acerto resultado (vitoria / empate)
    1 = acerto placar uma das equipes */

    function calculateScore(result, bet) {
      // console.log('calculateScore');
      let score = 0;

      if (bet) {
        let matchWinner = decideWinner(result);
        // console.log('match winner: ' + matchWinner);
        let betWinner = decideWinner(bet);
        // console.log('bet winner: ' + betWinner);

        if (result.home === bet.home && result.away === bet.away) {
          //Acerto do placar = 5 pontos
          // console.log('exactResult');
          score += rules.exactResult;
        } else if (matchWinner === betWinner) {
            //Acerto do resultado (vitoria / empate) = 3 pontos
            // console.log('result');
            score += rules.result;
        } else if (result.home === bet.home || result.away === bet.away) {
          //Acerto do placar de uma das equipes = 1 ponto
          // console.log('teamScore');
          score += rules.teamScore;
        }

        // console.log('result casa: '+ result.home + 'x palpite casa: ' + bet.home);
        // console.log('result visitante: ' + result.away + 'x palpite visitante: ' + bet.away);

        // console.log('score: ' + score);
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

        return $q.resolve(user);
      });
    }
  }
})();
