(function() {
  'use strict';

  angular.module('appCore').factory('tournamentService', tournamentService);

  tournamentService.$inject = ['$firebaseArray', '$firebaseRef', '$q', 'scoreService', 'userService', 'APP_CONFIG'];

  function tournamentService($firebaseArray, $firebaseRef, $q, scoreService, userService, APP_CONFIG) {
    let data = {};

    data.teams = $firebaseArray($firebaseRef.teams);
    data.matches = $firebaseArray($firebaseRef.matches);
    data.players = $firebaseArray($firebaseRef.players);
    data.scores = $firebaseArray($firebaseRef.public);
    data.config = $firebaseArray($firebaseRef.tourconfig);
    data.ranking = $firebaseArray($firebaseRef.tourrank);

    return {
      data: data,
      addTeams: addTeams,
      getTeam: getTeam,
      saveTeam: saveTeam,
      removeTeam: removeTeam,
      addPlayers: addPlayers,
      removePlayer: removePlayer,
      uploadMatches: uploadMatches,
      getMatch: getMatch,
      saveMatch: saveMatch,
      updateResult: updateResult,
      getRankingLastUpdate: getRankingLastUpdate
    };

    // TEAM METHODS

    function addTeams(string) {
      try {
        let decomposed = string.split('\n').map(str => {
          let items = str.split(';');

          if (items.length !== APP_CONFIG.teamFields.length) {
            throw new Error('Número de campos incorreto!');
          }

          let teamObj = {};
          items.forEach((item, idx) => {
            let field = APP_CONFIG.teamFields[idx];
            teamObj[field] = item.trim();
          });

          return teamObj;
        });

        return data.teams.$loaded()
          .then(teams => {
            return $q.all(decomposed.map(team => teams.$add(team)));
          });
      } catch (error) {
        return $q.reject(error);
      }
    }

    function getTeam(shortName) {
      return data.teams.$loaded()
      .then(teams => {
        let found = teams.find(team => {
          return team.shortName === shortName;
        });

        return found;
      });
    }

    function saveTeam(team) {
      return data.teams.$loaded()
      .then(teams => {
        let index = teams.$indexFor(team.$id);

        teams[index] = team;

        return teams.$save(index);
      });
    }

    function removeTeam(team) {
      return data.teams.$loaded()
      .then(teams => {
        return teams.$remove(team);
      });
    }

    // PLAYER METHODS

    function addPlayers(newPlayers, team) {
      return data.players.$loaded()
      .then(players => {
        let promises = newPlayers.map(newPlayer => {
          if (newPlayer.length) {
            let playerToAdd = {};
            playerToAdd.name = newPlayer.trim();
            playerToAdd.team = team.$id;

            return players.$add(playerToAdd);
          }
        });

        return $q.all(promises);
      });
    }

    function removePlayer(playerToRemove) {
      return data.players.$loaded()
      .then(players => {
        return players.$remove(playerToRemove);
      });
    }

    // MATCH METHODS

    function uploadMatches(string) {
      let matchlist = decomposeMatches(string);
      let newList;

      try {
        newList = matchlist.map(match => {
          match = decomposeMatchData(match);
          match = createMatchObject(match);
          match.datetime = parseDate(match.datetime);
          checkTeamNames(match);

          return match;
        });
      } catch (error) {
        return $q.reject(error);
      }

      return data.matches.$loaded()
      .then(matches => {
        newList.forEach(newMatch => {
          matches.$add(newMatch);
        });

        return matches;
      });
    }

    function getMatch(matchId) {
      return data.matches.$loaded()
      .then(matches => {
        return matches.$getRecord(matchId);
      });
    }

    function saveMatch(match) {
      return data.matches.$loaded()
      .then(matches => {
        let index = matches.$indexFor(match.$id);

        return matches.$save(index);
      });
    }

    function getRankingLastUpdate(){
      var lastUpdate;
      console.log('getRankingLastUpdate');
      
      data.ranking.$loaded()
      .then(ref => {
        lastUpdate = ref.$getRecord('lastUpdate')['$value'];
        console.log(lastUpdate);
        return lastUpdate;
      });
      
    }

    function updateResult(match, result) {
      console.log('Tour - updateResult');
      let regexp = new RegExp('^[0-9].*[0-9]$');

      console.log(data.ranking)

      match.result = {};

      if (result) {
        result = result.trim();
      }

      if (!regexp.test(result) && result) {
        let error = new Error('O primeiro e último caractere do resultado devem ser o números');

        return $q.reject(error);
      } else if (regexp.test(result)) {
        result = result.split("");
        match.result.home = result[0];
        match.result.away = result[result.length - 1];
      }
      console.log('saveMatch');
      console.log(result);
      return saveMatch(match)
      .then(resp => {
        return scoreService.updateUserScores(match);
      });
    }

    // HELPER FUNCTIONS

    function parseDate(string) {
      let date = new Date(string);

      if (date === 'Invalid Date') {
        throw new Error('Formato de data inválido.');
      }

      return date.getTime();
    }

    function checkTeamNames(match) {
      let findHome = lookUpTeamName(match.home.trim());
      let findAway = lookUpTeamName(match.away.trim());

      if (findHome && findAway) {
        match.home = findHome;
        match.away = findAway;
      } else if (!find.home) {
        throw new Error(match.home + ' não está na lista');
      } else {
        throw new Error(match.away + ' não está na lista');
      }
    }

    function createMatchObject(matchArray) {
      let matchObj = {};

      if (matchArray.length === APP_CONFIG.matchFields.length) {
        matchArray.forEach((currentData, index) => {
          let currentField = APP_CONFIG.matchFields[index];

          matchObj[currentField] = currentData;
        });

        return matchObj;
      } else {
        throw new Error('O número de colunas está incorreto.');
      }
    }

    function decomposeMatches(string) {
      return string.split('\n');
    }

    function decomposeMatchData(string) {
      return string.split(';');
    }

    function lookUpTeamName(name) {
      return data.teams.find(existingTeam => {
        if (existingTeam.shortName === name || existingTeam.longName === name) {
          return true;
        }
        return false;
      });
    }
  }
})();
