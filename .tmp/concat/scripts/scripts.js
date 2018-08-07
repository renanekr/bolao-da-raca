'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @name bolaodaracaApp
   * @description
   * # bolaodaracaApp
   *
   * Main module of the application.
   */

  angular.module('bolaodaracaApp', ['appCore', 'myBets', 'user', 'admin']);

  angular.module('appCore', ['ngMessages', 'ngResource', 'ngSanitize', 'ui.router', 'firebase', 'angulartics' //,
  // 'angulartics.google.tagmanager'
  ]);

  angular.module('myBets', ['ui.bootstrap']);

  angular.module('user', []);

  angular.module('admin', []);
})();

(function () {
  'use strict';

  angular.module('appCore').constant('APP_CONFIG', {

    // Firebase ref url
    fbUrl: 'https://bolao-da-raca-b8d39.firebaseio.com/',

    // Closing time before match start in ms
    timeLimit: 1800000,
    // timeLimit: -2592000000,

    // Data fields for match upload
    matchFields: ['group', 'round', 'datetime', 'location', 'home', 'away'],

    // Data fields for team upload
    teamFields: ['longName', 'shortName', 'ISO', 'iconImg'],

    // Points rewarded for bets
    rules: {
      result: 3,
      exactResult: 5,
      teamScore: 1,
      finalWinner: 3,
      topScorer: 3
    },

    // Eligible competitions
    leagues: ['Brasileirão Serie B 2018'],

    //Conversores de Data
    //http://www.ruddwire.com/handy-code/date-to-millisecond-calculators/#.WzA4Yy3OrOQ
    //https://www.timecalculator.net/milliseconds-to-date

    // Starting time: 2018.06.14. 12:00
    startTime: 1528988400000
    //Libera bets: 01/08/2018 = 1533092400000
    // startTime: 1533092400000

  }).config(appRouting).config(firebase).run(stateWatchers);

  // FIREBASE

  firebase.$inject = ['$firebaseRefProvider', 'APP_CONFIG'];

  function firebase($firebaseRefProvider, APP_CONFIG) {
    $firebaseRefProvider.registerUrl({
      default: APP_CONFIG.fbUrl,
      users: APP_CONFIG.fbUrl + 'users',
      public: APP_CONFIG.fbUrl + 'public',
      tournament: APP_CONFIG.fbUrl + 'tournament',
      tourconfig: APP_CONFIG.fbUrl + 'tournament/config',
      teams: APP_CONFIG.fbUrl + 'tournament/teams',
      matches: APP_CONFIG.fbUrl + 'tournament/matches',
      players: APP_CONFIG.fbUrl + 'tournament/players',
      leagues: APP_CONFIG.fbUrl + 'leagues',
      admin: APP_CONFIG.fbUrl + 'admin',
      pending: APP_CONFIG.fbUrl + 'admin/pending',
      promo: APP_CONFIG.fbUrl + 'promo'
    });
  }

  // ROUTING

  appRouting.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

  function appRouting($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/dashboard');

    $stateProvider.state('app', {
      abstract: true,
      url: '',
      views: {
        navigation: {
          templateUrl: 'views/navigation.html',
          controller: 'NavigationController',
          controllerAs: 'navigation'
        },
        content: {
          template: '<ui-view></ui-view>'
        }
      },
      resolve: {
        user: ["$firebaseAuthService", "userService", function user($firebaseAuthService, userService) {
          return $firebaseAuthService.$requireSignIn().then(function (data) {
            console.log('$stateProvider resolve');
            return userService.getUser(data.uid);
          });
        }]
      }
    }).state('app.dashboard', {
      url: '/dashboard',
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardController',
      controllerAs: 'dashboard',
      params: {
        temporary: false
      }
    }).state('app.myBets', {
      url: '/mybets',
      templateUrl: 'views/bets.html',
      controller: 'BetsController',
      controllerAs: 'bets',
      params: {
        filter: true
      }
    }).state('app.rules', {
      url: '/rules',
      templateUrl: 'views/rules.html'
    }).state('app.contact', {
      url: '/contact',
      templateUrl: 'views/contact.html'
    });
  }

  stateWatchers.$inject = ['$rootScope', '$state'];

  function stateWatchers($rootScope, $state) {
    $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
      if (error === "AUTH_REQUIRED") {
        $state.go("login");
      } else {
        console.error(error);
      }
    });
  }
})();

(function () {
  'use strict';

  angular.module('appCore').controller('NavigationController', NavigationController);

  NavigationController.$inject = ['$state', 'userService', 'user'];

  function NavigationController($state, userService, user) {
    var vm = this;
    vm.userService = userService;
    vm.user = user;
    vm.state = $state;
  }
})();

(function () {
  'use strict';

  angular.module('appCore').controller('MatchController', MatchController);

  MatchController.$inject = ['match', 'user', 'userService', 'APP_CONFIG'];

  function MatchController(match, user, userService, APP_CONFIG) {
    var vm = this;
    vm.current = match;
    vm.user = user;
    vm.users = userService.public;

    vm.userList = getUserList(match);

    vm.now = new Date().getTime();

    if (user.league && user.league.length) {
      vm.leagueFilter = user.league[0];
    }

    if (vm.now < match.datetime - APP_CONFIG.timeLimit) {
      match.status = "open";

      vm.sort = 'name';
      vm.reverse = false;
    } else if (!match.result) {
      match.status = "running";

      vm.sort = 'name';
      vm.reverse = false;
    } else {
      match.status = "closed";

      vm.sort = 'points';
      vm.reverse = true;
    }

    function getUserList(match) {
      var prepArray = vm.users.map(function (thisUser) {
        var prepUser = {};
        prepUser.name = thisUser.name;
        prepUser.league = thisUser.league;
        prepUser.uid = thisUser.uid;

        if (thisUser.bets && thisUser.bets.matches[match.$id]) {
          prepUser.home = thisUser.bets.matches[match.$id].home;
          prepUser.away = thisUser.bets.matches[match.$id].away;
          prepUser.points = thisUser.bets.matches[match.$id].points;
        } else {
          prepUser.points = 0;
        }

        return prepUser;
      });

      return prepArray;
    }
  }
})();

(function () {
  'use strict';

  angular.module('appCore').factory('tournamentService', tournamentService);

  tournamentService.$inject = ['$firebaseArray', '$firebaseRef', '$q', 'scoreService', 'userService', 'APP_CONFIG'];

  function tournamentService($firebaseArray, $firebaseRef, $q, scoreService, userService, APP_CONFIG) {
    var data = {};

    data.teams = $firebaseArray($firebaseRef.teams);
    data.matches = $firebaseArray($firebaseRef.matches);
    data.players = $firebaseArray($firebaseRef.players);
    data.scores = $firebaseArray($firebaseRef.public);
    data.config = $firebaseArray($firebaseRef.tourconfig);

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
      updateResult: updateResult
    };

    // TEAM METHODS

    function addTeams(string) {
      try {
        var decomposed = string.split('\n').map(function (str) {
          var items = str.split(';');

          if (items.length !== APP_CONFIG.teamFields.length) {
            throw new Error('Número de campos incorreto!');
          }

          var teamObj = {};
          items.forEach(function (item, idx) {
            var field = APP_CONFIG.teamFields[idx];
            teamObj[field] = item.trim();
          });

          return teamObj;
        });

        return data.teams.$loaded().then(function (teams) {
          return $q.all(decomposed.map(function (team) {
            return teams.$add(team);
          }));
        });
      } catch (error) {
        return $q.reject(error);
      }
    }

    function getTeam(shortName) {
      return data.teams.$loaded().then(function (teams) {
        var found = teams.find(function (team) {
          return team.shortName === shortName;
        });

        return found;
      });
    }

    function saveTeam(team) {
      return data.teams.$loaded().then(function (teams) {
        var index = teams.$indexFor(team.$id);

        teams[index] = team;

        return teams.$save(index);
      });
    }

    function removeTeam(team) {
      return data.teams.$loaded().then(function (teams) {
        return teams.$remove(team);
      });
    }

    // PLAYER METHODS

    function addPlayers(newPlayers, team) {
      return data.players.$loaded().then(function (players) {
        var promises = newPlayers.map(function (newPlayer) {
          if (newPlayer.length) {
            var playerToAdd = {};
            playerToAdd.name = newPlayer.trim();
            playerToAdd.team = team.$id;

            return players.$add(playerToAdd);
          }
        });

        return $q.all(promises);
      });
    }

    function removePlayer(playerToRemove) {
      return data.players.$loaded().then(function (players) {
        return players.$remove(playerToRemove);
      });
    }

    // MATCH METHODS

    function uploadMatches(string) {
      var matchlist = decomposeMatches(string);
      var newList = void 0;

      try {
        newList = matchlist.map(function (match) {
          match = decomposeMatchData(match);
          match = createMatchObject(match);
          match.datetime = parseDate(match.datetime);
          checkTeamNames(match);

          return match;
        });
      } catch (error) {
        return $q.reject(error);
      }

      return data.matches.$loaded().then(function (matches) {
        newList.forEach(function (newMatch) {
          matches.$add(newMatch);
        });

        return matches;
      });
    }

    function getMatch(matchId) {
      return data.matches.$loaded().then(function (matches) {
        return matches.$getRecord(matchId);
      });
    }

    function saveMatch(match) {
      return data.matches.$loaded().then(function (matches) {
        var index = matches.$indexFor(match.$id);

        return matches.$save(index);
      });
    }

    function updateResult(match, result) {
      console.log('Tour - updateResult');
      var regexp = new RegExp('^[0-9].*[0-9]$');

      match.result = {};

      if (result) {
        result = result.trim();
      }

      if (!regexp.test(result) && result) {
        var error = new Error('O primeiro e último caractere do resultado devem ser o números');

        return $q.reject(error);
      } else if (regexp.test(result)) {
        result = result.split("");
        match.result.home = result[0];
        match.result.away = result[result.length - 1];
      }
      console.log('saveMatch');
      console.log(result);
      return saveMatch(match).then(function (resp) {
        return scoreService.updateUserScores(match);
      });
    }

    // HELPER FUNCTIONS

    function parseDate(string) {
      var date = new Date(string);

      if (date === 'Invalid Date') {
        throw new Error('Nem jó a dátumformátum');
      }

      return date.getTime();
    }

    function checkTeamNames(match) {
      var findHome = lookUpTeamName(match.home.trim());
      var findAway = lookUpTeamName(match.away.trim());

      if (findHome && findAway) {
        match.home = findHome;
        match.away = findAway;
      } else if (!find.home) {
        throw new Error(match.home + ' nevű csapat nincs a listában');
      } else {
        throw new Error(match.away + ' nevű csapat nincs a listában');
      }
    }

    function createMatchObject(matchArray) {
      var matchObj = {};

      if (matchArray.length === APP_CONFIG.matchFields.length) {
        matchArray.forEach(function (currentData, index) {
          var currentField = APP_CONFIG.matchFields[index];

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
      return data.teams.find(function (existingTeam) {
        if (existingTeam.shortName === name || existingTeam.longName === name) {
          return true;
        }
        return false;
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('appCore').directive('ebFocus', ebFocus);

  ebFocus.$inject = ['$timeout'];

  function ebFocus($timeout) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element, attr) {
      scope.$watch(attr.ebFocus, function (value) {
        if (value) {
          // Wait for DOM to be ready
          $timeout(function () {
            element[0].focus();
            element[0].selectionStart = 0;
            element[0].selectionEnd = element[0].value.length;
          }, 0);
        } else {
          element[0].blur();
        }
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('appCore').filter('team', teamFilter).filter('open', openFilter).filter('noResult', noResultFilter).filter('result', resultFilter).filter('league', leagueFilter);

  function teamFilter() {
    return function (list, team) {
      var filteredData = [];
      list = list || [];

      list.forEach(function (elem) {
        if (elem.team === team) {
          filteredData.push(elem);
        }
      });

      return filteredData;
    };
  }

  openFilter.$inject = ['APP_CONFIG'];

  function openFilter(APP_CONFIG) {
    return function (matchList, open, time) {
      var filteredData = [];
      matchList = matchList || [];
      time = time || new Date().getTime();

      if (open) {
        matchList.forEach(function (match) {
          if (time < match.datetime - APP_CONFIG.timeLimit && !match.result) {
            filteredData.push(match);
          }
        });

        return filteredData;
      } else {
        matchList.forEach(function (match) {
          if (time > match.datetime - APP_CONFIG.timeLimit || match.result) {
            filteredData.push(match);
          }
        });

        return filteredData;
      }
    };
  }

  function noResultFilter() {
    return function (matchList) {
      var filteredData = [];

      matchList = matchList || [];

      matchList.forEach(function (match) {
        if (!match.result) {
          filteredData.push(match);
        }
      });

      return filteredData;
    };
  }

  resultFilter.$inject = ['APP_CONFIG'];

  function resultFilter(APP_CONFIG) {
    return function (matchList) {
      var filteredData = [];
      matchList = matchList || [];

      matchList.forEach(function (match) {
        if (match.result) {
          filteredData.push(match);
        }
      });

      return filteredData;
    };
  }

  function leagueFilter() {
    return function (array, league) {
      var filtered = [];

      if (league) {
        array.forEach(function (item) {
          if (_typeof(item.league) === 'object') {
            var found = item.league.find(function (x) {
              return x === league;
            });

            if (found) {
              filtered.push(item);
            }
          } else if (typeof item.league === 'string') {
            if (item.league === league) {
              filtered.push(item);
            }
          }
        });

        return filtered;
      } else {
        return array;
      }
    };
  }
})();

(function () {
  'use strict';

  angular.module('appCore').factory('scoreService', scoreService);

  scoreService.$inject = ['$q', '$firebaseObject', '$firebaseRef', 'userService', 'APP_CONFIG'];

  function scoreService($q, $firebaseObject, $firebaseRef, userService, APP_CONFIG) {
    var rules = APP_CONFIG.rules;

    return {
      updateUserScores: updateUserScores
    };

    function updateUserScores(match) {
      // console.log('updateUserScores');
      return userService.getUserList().then(function (resp) {
        if (match) {
          var users = resp.map(function (user) {
            // console.log('updateUserScores -> updateMatchScore: '+ user.name);
            return updateMatchScore(user, match);
          });

          return $q.all(users.map(function (user) {
            return userService.saveUser(user).then(function (resp) {
              return $q.resolve(user);
            });
          }));
        }
        return $q.resolve(resp);
      }).then(function (users) {
        var usersWithTotalScore = users.map(function (user) {
          return getTotalScore(user);
        });

        return $q.all(usersWithTotalScore);
      }).then(function (users) {
        return $q.all(users.map(function (user) {
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
      var score = 0;

      if (bet) {
        var matchWinner = decideWinner(result);
        // console.log('match winner: ' + matchWinner);
        var betWinner = decideWinner(bet);
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
      var winner = void 0;

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
        var error = new Error(user + ' não tem uid!');

        return $q.reject(error);
      }

      return userService.getUserMatchBets(user.uid).then(function (matches) {
        var score = matches.reduce(function (prev, cur) {
          if (cur.points) {
            prev += cur.points;
          }

          return prev;
        }, 0);

        var extraScore = user.extraPoints || 0;

        user.totalScore = score + extraScore;

        return $q.resolve(user);
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('appCore').controller('DashboardController', DashboardController);

  DashboardController.$inject = ['$state', '$interval', 'userService', 'adminService', 'tournamentService', 'user', '$uibModal', 'APP_CONFIG'];

  function DashboardController($state, $interval, userService, adminService, tournamentService, _user, $uibModal, APP_CONFIG) {
    var vm = this;

    vm.tour = tournamentService;
    vm.user = _user;
    vm.users = userService.public;
    vm.timeLimit = APP_CONFIG.timeLimit;

    vm.promo = adminService.promo;

    vm.now = new Date().getTime();

    $interval(function () {
      vm.now = new Date().getTime();
    }, 10000);

    // console.log('user.alerts');
    // console.log(user.alerts);
    // console.log('user.alerts.ruleAlert: ' + user.alerts.ruleAlert);
    /*
    if (!user.alerts || !user.alerts.ruleAlert) {
      let ruleModal = $uibModal.open({
        templateUrl: 'views/rule_modal.html',
        controller: 'RuleModalController',
        controllerAs: 'ruleModal',
        animation: true,
        backdrop: 'static',
        resolve: {
          user: () => {
            return user;
          }
        }
      });
       ruleModal.result
      .then(result => {
        toastr.success(result);
      })
      .catch(error => {
        console.error(error);
      });
    }
    */
    if (_user.league && _user.league.length) {
      vm.leagueFilter = _user.league[0];
    }

    if ($state.params.temporary) {
      var tempModal = $uibModal.open({
        templateUrl: 'views/password_modal.html',
        controller: 'PasswordController',
        controllerAs: 'password',
        animation: true,
        backdrop: 'static',
        keyboard: false,
        size: 'sm',
        resolve: {
          user: function user() {
            return _user;
          }
        }
      });

      tempModal.result.then(function (result) {
        toastr.success(result);
      }).catch(function (error) {
        console.error(error);
      });
    }

    if (!_user.name) {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/welcome_modal.html',
        controller: 'modalController',
        controllerAs: 'modal',
        animation: true,
        backdrop: 'static',
        keyboard: false,
        resolve: {
          user: function user() {
            return _user;
          }
        }
      });

      modalInstance.result.then(function (result) {
        toastr.success(result);
      }).catch(function (error) {
        console.error(error);
      });
    }

    // console.log(vm.promo.validTo);
    vm.showPromo = function (promo, user) {
      if (vm.now < vm.promo.validTo) {
        var match = user.league.find(function (league) {
          return promo.league === league;
        });

        return match;
      } else {
        return false;
      }
    };

    vm.replyToPromo = function (promo, user, answer) {
      adminService.addPromoReply(promo, user, answer).then(function () {
        toastr.success("Obrigado pelo feedback!");
      }).catch(function (error) {
        console.error(error);
      });
    };

    vm.getObjSize = function (obj) {
      if (obj == null) return 0;else return Object.keys(obj).length;
    };
  }
})();

(function () {
  'use strict';

  angular.module('appCore').controller('modalController', modalController);

  modalController.$inject = ['$uibModalInstance', 'userService', 'user'];

  function modalController($uibModalInstance, userService, user) {
    var vm = this;
    vm.user = user;

    vm.saveUser = function (name, company) {
      if (!name) {
        throw new Error('Nincs név megadva');
      }

      user.name = name;

      if (company) {
        user.company = company;
      }

      userService.saveUser(user).then(function (resp) {
        $uibModalInstance.close('Elmentettük az adataidat!');
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('appCore').controller('RuleModalController', RuleModalController);

  RuleModalController.$inject = ['$uibModalInstance', 'userService', 'user'];

  function RuleModalController($uibModalInstance, userService, user) {
    var vm = this;
    vm.user = user;

    console.log(vm.user);
    vm.turnOffAlert = function (user) {
      user.alerts = user.alers || {};
      user.alerts.ruleAlert = false; //true mostra o modal das regras

      userService.saveUser(user).then(function (user) {
        $uibModalInstance.close('Ok! Você não receberá mais notificações.');
      });
    };

    vm.closeAlert = function () {
      $uibModalInstance.close();
    };
  }
})();

(function () {
  'use strict';

  angular.module('appCore').controller('PasswordController', PasswordController);

  PasswordController.$inject = ['user', 'userService', '$uibModalInstance'];

  function PasswordController(user, userService, $uibModalInstance) {
    var vm = this;

    vm.changePassword = function (form) {
      var credentials = {
        email: user.email,
        newPassword: form.password,
        oldPassword: form.tempPassword
      };

      userService.changePassword(credentials).then(function (resp) {
        $uibModalInstance.close('Elmentettük a jelszavadat!');
      }).catch(function (error) {
        console.error(error);
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('myBets').controller('BetsController', BetsController);

  BetsController.$inject = ['$state', 'tournamentService', 'user', 'betService', 'APP_CONFIG'];

  function BetsController($state, tournamentService, user, betService, APP_CONFIG) {
    var vm = this;
    var tour = tournamentService;

    vm.inputs = {};
    vm.matchBet = {};
    vm.now = new Date().getTime();
    vm.data = tour.data;
    vm.user = user;
    vm.timeLimit = APP_CONFIG.timeLimit;
    // console.log(vm.timeLimit);
    vm.startTime = APP_CONFIG.startTime;
    // console.log(vm.startTime);
    // console.log($state);
    vm.onlyOpen = $state.params.filter;
    // console.log(vm.onlyOpen);

    if (vm.now < vm.startTime - vm.timeLimit) {
      if (!user.bets || !user.bets.winner || !user.bets.topScorer) {
        vm.showTopForm = true;
      } else {
        vm.showTopForm = false;
      }
    } else {
      vm.showTopForm = false;
    }

    vm.addWinnerAndScorer = function (data) {
      var now = new Date().getTime();

      if (now < vm.startTime - vm.timeLimit) {
        betService.saveWinner(data, user).then(function () {
          toastr.success('Favorito salvo com sucesso!');
          vm.showTopForm = false;
        }).catch(function (error) {
          toastr.error(error.message);
        });
      } else {
        toastr.error('Você não pode mais palpitar no campeão e goleiro');
      }
    };

    vm.loadBets = function () {
      vm.topForm = {};
      vm.topForm.winner = user.bets.winner;
      vm.topForm.topScorer = user.bets.topScorer;
    };

    vm.updateBet = function (bet, matchId) {
      betService.saveMatchBet(bet, matchId, user).then(function () {
        if (bet) {
          toastr.success("Palpite salvo com sucesso!");
        }

        vm.inputs[matchId] = false;
        vm.matchBet[matchId] = undefined;
      }).catch(function (error) {
        // console.log(error);
        toastr.error(error.message);
        vm.inputs[matchId] = false;
        vm.matchBet[matchId] = undefined;
      });
    };

    vm.submitBetOnEnter = function (event, bet, matchId) {
      if (event.keyCode === 13) {
        vm.updateBet(bet, matchId);
      }
    };

    vm.loadMatchBet = function (bet, matchId) {
      if (bet) {
        vm.matchBet[matchId] = bet.home + "x" + bet.away;
      }
    };
  }
})();

(function () {
  'use strict';

  angular.module('myBets').factory('betService', betService);

  betService.$inject = ['$q', 'userService', 'tournamentService', 'APP_CONFIG'];

  function betService($q, userService, tournamentService, APP_CONFIG) {
    return {
      saveWinner: saveWinner,
      saveMatchBet: saveMatchBet
    };

    function saveWinner(bets, user) {
      user.bets = user.bets || {};
      user.bets.winner = bets.winner;
      user.bets.topScorer = bets.topScorer;

      return userService.saveUser(user);
    }

    function saveMatchBet(bet, matchID, user) {
      return tournamentService.getMatch(matchID).then(function (match) {
        // console.log('saveMatchBet -> getMatch');
        // console.log(match);

        var now = new Date().getTime();
        var matchTime = match.datetime;
        var timeLimit = APP_CONFIG.timeLimit;
        var matchRound = match.round;
        var matchGroup = match.group;

        if (now > matchTime - timeLimit) {
          var error = new Error('O palpite para este jogo está encerrado.');

          return $q.reject(error);
        }

        user.bets = user.bets || {};
        user.bets.matches = user.bets.matches || {};

        if (bet) {
          try {
            bet = parseBet(bet, matchRound, matchGroup);
            // console.log('parseBet');
            // console.log(bet);
          } catch (error) {
            return $q.reject(error);
          }

          user.bets.matches[matchID] = bet;
        }

        return userService.saveUser(user);
      });
    }

    function parseBet(bet, matchRound, matchGroup) {
      var regexp = new RegExp('^[0-9].*[0-9]$');
      var home = void 0;
      var away = void 0;
      var round = void 0;
      var group = void 0;

      bet = bet.trim();

      if (regexp.test(bet)) {
        bet = bet.split("");

        home = bet[0];
        away = bet[bet.length - 1];
        round = matchRound;
        group = matchGroup;
      } else {
        throw new Error('O formato é inválido');
      }

      return {
        home: home,
        away: away,
        round: round,
        group: group
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('myBets').directive('listToValidate', listDirective);

  function listDirective() {
    return {
      require: 'ngModel',
      link: link
    };
  }

  function link(scope, element, attr, controller) {
    controller.$validators.listToValidate = function (modelValue, viewValue) {
      var list = attr.listToValidate;
      var data = scope.bets.data;

      if (controller.$isEmpty(modelValue)) {
        return true;
      }

      var check = data[list].find(function (elem) {
        return elem.longName === viewValue || elem.name === viewValue;
      });

      if (check) {
        return true;
      }
      return false;
    };
  }
})();

(function () {
  'use strict';

  angular.module('user').controller('LoginController', LoginController);

  LoginController.$inject = ['userService'];

  function LoginController(userService) {
    var vm = this;

    vm.user = userService;
    vm.loading = false;

    vm.login = function (data) {
      data.email = data.email.toLowerCase();

      vm.loading = true;

      userService.login(data).catch(function (error) {
        toastr.error(error.message);
        vm.loading = false;
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('user').controller('UserRegisterController', UserRegisterController);

  UserRegisterController.$inject = ['userService'];

  function UserRegisterController(userService) {
    var vm = this;
    vm.loading = false;

    vm.registerUser = function (email, password) {
      vm.loading = true;

      var credentials = {
        email: email.toLowerCase(),
        password: password
      };

      userService.register(credentials).catch(function (error) {
        if (error === "IE Object doesn't support property or method 'find'") {
          vm.errorMessage = "O sistema não é suportado neste navegador. Entre com Chrome ou o Firefox!";
        }

        vm.loading = false;
        toastr.error(error.message);
        console.error(error);
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('user').controller('ProfileController', ProfileController);

  ProfileController.$inject = ['$window', 'user', 'userService'];

  function ProfileController($window, user, userService) {
    var vm = this;
    vm.user = user;
    vm.form = {};

    vm.editParam = function (param) {
      vm.form[param] = user[param];
    };

    vm.saveParam = function (param, newValue) {
      if (newValue && newValue !== user[param]) {
        user[param] = newValue;

        userService.saveUser(user).then(function (resp) {
          toastr.success('Dados salvos com sucesso!');
        }).catch(function (error) {
          toastr.error(error.message);
        });
      }

      vm.form[param] = false;
    };

    vm.deleteProfile = function (password) {
      var cred = {
        email: user.email,
        password: password
      };

      userService.login(cred).then(function () {
        var confirm = $window.confirm('Tem certeza de que deseja se excluir? Com isso, todos os seus palpites e resultados serão perdidos.');

        if (confirm) {
          return userService.removeUser(cred, user);
        } else {
          profile.showPassword = false;
        }
      }).catch(function (error) {
        toastr.error(error.message);
      });
    };

    vm.changePassword = function (form) {
      var credentials = {
        email: user.email,
        newPassword: form.password,
        oldPassword: form.oldPassword
      };

      userService.changePassword(credentials).then(function (resp) {
        toastr.success("Senha alterada com sucesso.");
        vm.showPasswordChange = false;
      }).catch(function (error) {
        console.error(error);
      });
    };

    vm.reset = function (form) {
      form.$setPristine();
      form.$setUntouched();
    };
  }
})();

(function () {
  'use strict';

  angular.module('user').controller('PublicController', PublicController);

  PublicController.$inject = ['currentUser', 'userService', 'tournamentService', 'APP_CONFIG'];

  function PublicController(currentUser, userService, tournamentService, APP_CONFIG) {
    var vm = this;
    var tour = tournamentService;

    vm.user = currentUser;
    vm.matches = tour.data.matches;
    vm.now = new Date().getTime();
    vm.start = APP_CONFIG.startTime;
  }
})();

(function () {
  'use strict';

  angular.module('user').controller('ResetPasswordController', ResetPasswordController);

  ResetPasswordController.$inject = ['$state', 'userService'];

  function ResetPasswordController($state, userService) {
    var vm = this;

    vm.resetPassword = function (email) {
      userService.resetPassword({ email: email }).then(function (resp) {
        toastr.success('Sua nova senha foi enviada por e-mail.');

        $state.go('login');
      }).catch(function (error) {
        if (error.message === 'The specified user does not exist.') {
          toastr.error('E-mail não cadastado no bolão');
        } else {
          console.error(error);
        }
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('user').factory('userService', userService);

  userService.$inject = ['$q', '$firebaseObject', '$firebaseArray', '$firebaseAuthService', '$firebaseRef', '$state', 'APP_CONFIG', 'adminService'];

  function userService($q, $firebaseObject, $firebaseArray, $firebaseAuthService, $firebaseRef, $state, APP_CONFIG, adminService) {
    var auth = $firebaseAuthService;
    var users = $firebaseArray($firebaseRef.users);
    var usersPublic = $firebaseArray($firebaseRef.public);

    auth.$onAuthStateChanged(function (newData) {
      if (newData) {
        if ($state.current.name === 'login' || $state.current.name === 'register') {
          $state.go('app.dashboard', { temporary: false }); // TODO: temp password flow is broken
        }
      } else {
        $state.go('login');
      }
    });

    function getUser(uid) {
      return users.$loaded().then(function (ref) {
        console.log('getUser');
        console.log(ref.$getRecord(uid));
        return ref.$getRecord(uid);
      });
    }

    function getUserMatchBets(uid) {
      // console.log(uid);
      // console.log(APP_CONFIG.fbUrl + 'users/' + uid + '/bets/matches');

      // let matchesRef = new Firebase(APP_CONFIG.fbUrl + 'users/' + uid + '/bets/matches');
      var matchesRef = firebase.database().ref('users/' + uid + '/bets/matches');
      var matches = $firebaseArray(matchesRef);

      if (matches) {
        return matches.$loaded();
      } else {
        var error = "Falha ao carregar palpites";

        return $q.reject(error);
      }
    }

    function getUserList() {
      return users.$loaded();
    }

    function login(credentials) {
      console.log('login');
      console.log(credentials);
      var date = new Date().getTime();
      console.log(date);

      return auth.$signInWithEmailAndPassword(credentials.email, credentials.password).then(function (data) {
        console.log('data');
        console.log(data);
        return getUser(data.uid);
      }).then(function (user) {
        console.log('user');
        console.log(user);
        if (user) {
          user.lastLogin = date;
          return saveUser(user);
        }
      });
    }

    function logout() {
      auth.$signOut();
    }

    function createUser(newUid, newEmail, newName, newLeague) {
      var userObject = $firebaseObject($firebaseRef.users);
      return userObject.$loaded().then(function (userObj) {
        var date = new Date();

        var newUser = {
          email: newEmail,
          name: newName,
          createdAt: date.getTime(),
          admin: false,
          uid: newUid,
          league: [newLeague],
          totalScore: 0,
          extraPoints: 0

        };

        userObj[newUid] = newUser;

        return userObj.$save();
      }).then(function (resp) {
        return usersPublic.$loaded();
      }).then(function (publicData) {
        return publicData.$add({
          uid: newUid,
          league: [newLeague],
          score: 0
        });
      });
    };

    function register(credentials) {
      var newUid = void 0,
          pending = void 0,
          pendingList = void 0;

      return adminService.getPendingList().then(function (list) {
        pendingList = list;
        pending = list.find(function (item) {
          var lower = item.email.toLowerCase();

          return lower === credentials.email;
        });

        if (!pending) {
          var error = new Error('Você não pode se registrar com este endereço de e-mail. Entre em os organizadores (Renan ou Betão)!');

          return $q.reject(error);
        } else {
          return auth.$createUserWithEmailAndPassword(credentials.email, credentials.password);
        }
      }).then(function (data) {
        newUid = data.uid;

        return auth.$signInWithEmailAndPassword(credentials.email, credentials.password);
      }).then(function () {
        pendingList.$remove(pending);

        var userObject = $firebaseObject($firebaseRef.users);

        return userObject.$loaded();
      }).then(function (userObj) {
        var date = new Date();

        var newUser = {
          email: credentials.email,
          createdAt: date.getTime(),
          admin: false,
          uid: newUid,
          league: [pending.league]
        };

        userObj[newUid] = newUser;

        return userObj.$save();
      }).then(function (resp) {
        return usersPublic.$loaded();
      }).then(function (publicData) {
        return publicData.$add({
          uid: newUid,
          league: [pending.league],
          score: 0
        });
      });
    }

    function saveUser(user) {
      console.log('saveUser: ' + user.name);
      return users.$save(user).then(function (ref) {
        return usersPublic.$loaded();
      }).then(function (publicData) {
        var found = publicData.find(function (item) {
          return item.uid === user.uid;
        });

        if (!found) {
          return publicData.$add({
            name: user.name || null,
            uid: user.uid,
            score: user.totalScore || 0,
            league: user.league,
            bets: user.bets || null,
            company: user.company || null
          });
        } else {
          found.name = user.name || null;
          found.score = user.totalScore || 0;
          found.league = user.league;
          found.bets = user.bets || null;
          found.company = user.company || null;

          return publicData.$save(found);
        }
      });
    }

    function removeUser(cred, user) {
      return users.$remove(user).then(function () {
        return usersPublic.$loaded();
      }).then(function (publicArray) {
        var found = publicArray.find(function (item) {
          return item.uid === user.uid;
        });

        return publicArray.$remove(found);
      }).then(function () {
        return auth.$deleteUser();
      });
    }

    function resetPassword(credentials) {
      return auth.$sendPasswordResetEmail(credentials.email);
    }

    function changePassword(credentials) {
      // console.log(credentials)
      return auth.$updatePassword(credentials.newPassword);
    }

    return {
      public: usersPublic,
      login: login,
      logout: logout,
      register: register,
      getUser: getUser,
      createUser: createUser,
      getUserMatchBets: getUserMatchBets,
      saveUser: saveUser,
      removeUser: removeUser,
      getUserList: getUserList,
      resetPassword: resetPassword,
      changePassword: changePassword
    };
  }
})();

(function () {
  'use strict';

  angular.module('user').config(userRouting);

  // ROUTING

  userRouting.$inject = ['$stateProvider'];

  function userRouting($stateProvider) {
    $stateProvider.state('app.profile', {
      url: '/profile',
      templateUrl: 'views/profile.html',
      controller: 'ProfileController',
      controllerAs: 'profile'
    }).state('app.public', {
      url: '/public/:uid',
      templateUrl: 'views/public_profile.html',
      controller: 'PublicController',
      controllerAs: 'public',
      params: {
        uid: null
      },
      resolve: {
        currentUser: ["$stateParams", "userService", function currentUser($stateParams, userService) {
          return userService.public.$loaded().then(function (publicList) {
            return publicList.find(function (item) {
              return item.uid === $stateParams.uid;
            });
          });
        }]
      }
    }).state('app.match', {
      url: '/match/:matchId',
      templateUrl: 'views/match.html',
      controller: 'MatchController',
      controllerAs: 'match',
      resolve: {
        match: ["$stateParams", "tournamentService", function match($stateParams, tournamentService) {
          return tournamentService.getMatch($stateParams.matchId);
        }]
      }
    }).state('login', {
      url: '/login',
      views: {
        content: {
          templateUrl: 'views/login.html',
          controller: 'LoginController',
          controllerAs: 'login'
        }
      }
    }).state('register', {
      url: '/register',
      views: {
        content: {
          templateUrl: 'views/register.html',
          controller: 'UserRegisterController',
          controllerAs: 'register'
        }
      }
    }).state('reset', {
      url: '/reset',
      views: {
        content: {
          templateUrl: 'views/reset.html',
          controller: 'ResetPasswordController',
          controllerAs: 'reset'
        }
      }
    });
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('AdminController', AdminController);

  AdminController.$inject = ['$state'];

  function AdminController($state) {
    var vm = this;

    vm.state = $state;
  }
})();

(function () {
  'use strict';

  angular.module('admin').config(adminRouting);

  // ROUTING

  adminRouting.$inject = ['$stateProvider'];

  function adminRouting($stateProvider) {
    $stateProvider.state('app.admin', {
      url: '/admin',
      templateUrl: 'views/admin.html',
      controller: 'AdminController',
      controllerAs: 'admin',
      resolve: {
        admin: ["$q", "user", function admin($q, user) {
          if (user.admin) {
            return $q.resolve(true);
          }
          return $q.reject('Sem acesso de Administrador!');
        }]
      }
    }).state('app.admin.teamList', {
      url: '/teams',
      templateUrl: 'views/teams.html',
      controller: 'TeamsController',
      controllerAs: 'teams'
    }).state('app.admin.teamDetails', {
      url: '/teams/:team',
      templateUrl: 'views/teamdetails.html',
      controller: 'TeamDetailsController',
      controllerAs: 'team',
      resolve: {
        team: ["tournamentService", "$stateParams", function team(tournamentService, $stateParams) {
          return tournamentService.getTeam($stateParams.team);
        }]
      }
    }).state('app.admin.matches', {
      url: '/matches',
      templateUrl: 'views/matches.html',
      controller: 'MatchesController',
      controllerAs: 'matches'
    }).state('app.admin.participants', {
      url: '/participants',
      templateUrl: 'views/participants.html',
      controller: 'ParticipantsController',
      controllerAs: 'participants',
      resolve: {
        userList: ["userService", function userList(userService) {
          return userService.getUserList();
        }],
        pendingList: ["adminService", function pendingList(adminService) {
          return adminService.getPendingList();
        }]
      }
    }).state('app.admin.ranking', {
      url: '/ranking',
      templateUrl: 'views/ranking.html',
      controller: 'RankingController',
      controllerAs: 'ranking',
      resolve: {
        userList: ["userService", function userList(userService) {
          return userService.getUserList();
        }],
        pendingList: ["adminService", function pendingList(adminService) {
          return adminService.getPendingList();
        }]
      }
    }).state('app.admin.configuration', {
      url: '/matches',
      templateUrl: 'views/configuration.html',
      controller: 'ConfigController',
      controllerAs: 'config'
    });
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('TeamsController', TeamsController);

  TeamsController.$inject = ['tournamentService'];

  function TeamsController(tournamentService) {
    var vm = this;
    var tour = tournamentService;

    vm.data = tour.data;
    vm.disableUpload = false;

    vm.reset = function (form) {
      vm.form = {};

      form.$setPristine();
      form.$setUntouched();
    };

    vm.upload = function (string, form) {
      tour.addTeams(string).then(function (resp) {
        if (resp) {
          toastr.success('Equipes importadas com sucesso');
          vm.uploadForm = false;
          vm.reset(form);
        }
      }).catch(function (error) {
        toastr.error(error);
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('MatchesController', MatchesController);

  MatchesController.$inject = ['tournamentService'];

  function MatchesController(tournamentService) {
    var vm = this;
    var tour = tournamentService;
    vm.uploadForm = false;
    vm.data = tour.data;
    vm.table = {};
    vm.table.sortColumn = 'datetime';
    vm.table.reverse = false;
    vm.table.editResult = false;

    vm.reset = function (form) {
      vm.form = {};

      form.$setPristine();
      form.$setUntouched();
    };

    vm.upload = function (matches, form) {
      tour.uploadMatches(matches).then(function (matches) {
        if (matches) {
          toastr.success('Jogos importados com sucesso!');
          vm.uploadForm = false;
          vm.reset(form);
        }
      }).catch(function (error) {
        toastr.error(error.message);
      });
    };

    vm.updateResult = function (match, result) {
      tour.updateResult(match, result).then(function (resp) {
        if (result) {
          toastr.success(match.home.longName + ' x ' + match.away.longName + ' resultado do jogo: ' + match.result.home + 'x' + match.result.away);
          vm.table.result[match.$id] = null;
        } else {
          toastr.success(match.home.longName + '-' + match.away.longName + ' resultado da partida excluído.');
        }

        vm.table.editResult = false;
      }).catch(function (error) {
        console.log(error);
        toastr.error('ERROR: ' + error.message);
      });
    };

    vm.updateResults = function () {
      tour.data.matches.forEach(function (match) {
        console.log(match.result.home + match.result.away);
        tour.updateResult(match, match.result.home + match.result.away).then(function (resp) {
          toastr.success(match.home.longName + ' x ' + match.away.longName + ' resultado do jogo: ' + match.result.home + 'x' + match.result.away);
        });
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('ParticipantsController', ParticipantsController);

  ParticipantsController.$inject = ['$window', 'userList', 'pendingList', 'userService', 'adminService', 'scoreService', 'APP_CONFIG'];

  function ParticipantsController($window, userList, pendingList, userService, adminService, scoreService, APP_CONFIG) {
    var vm = this;
    vm.players = userList;
    vm.pending = pendingList;
    vm.leagues = APP_CONFIG.leagues;
    vm.orderBy = 'name';
    vm.reverse = false;
    vm.leagueFilter = vm.leagues[0];
    vm.promo = adminService.promo;

    vm.makeUserAdmin = function (user) {
      user.admin = true;

      userService.saveUser(user).then(function () {
        toastr.success(user.email + ' tornou-se administrador.');
      }).catch(function (error) {
        toastr.error(error);
      });
    };

    vm.makeUserSimple = function (user) {
      user.admin = false;

      userService.saveUser(user).then(function () {
        toastr.error(user.email + ' NÃO é mais administrador.');
      }).catch(function (error) {
        toastr.error(error);
      });
    };

    vm.addNewEmails = function (list, league) {
      if (list) {
        list = list.replace(/\n/g, '');

        var array = list.trim().split(',');

        var lowerCaseArray = array.map(function (item) {
          return item.toLowerCase();
        });

        adminService.addNewEmails(lowerCaseArray, league).then(function (resp) {
          if (resp.length) {
            toastr.success(resp.length + ' novos endereços adicionados à fila');

            vm.form.newEmails = undefined;
            vm.showAddEmails = false;
          } else {
            toastr.warning(resp.length + ' um novo título foi adicionado à lista de espera');
          }
        }).catch(function (error) {
          console.error(error);
        });
      }
    };

    vm.addNewParticipant = function (uid, email, name, league) {
      console.log('addNewParticipants');
      console.log('uid: ' + uid + ', email: ' + email + ', name: ' + name + ', liga: ' + league);

      userService.createUser(uid, email, name, league).then(function (resp) {
        toastr.success('Usuário ' + name + ' adicionado com sucesso!');
        vm.form.uid = undefined;
        vm.form.email = undefined;
        vm.form.name = undefined;
        vm.showAddParticipant = false;
      }).catch(function (error) {
        console.error(error);
      });
    };

    vm.deletePending = function (item) {
      adminService.deletePending(item).then(function (resp) {
        toastr.success(item.email + ' cancelado');
      }).catch(function (error) {
        console.error(error);
      });
    };

    vm.checkLeague = function (user, league) {
      if (user.league && user.league.length) {
        return user.league.find(function (item) {
          return item === league;
        });
      } else {
        return false;
      }
    };

    vm.addLeague = function (user, league) {
      user.league = user.league || [];

      user.league.push(league);

      userService.saveUser(user).then(function () {
        toastr.success(user.name + ' a ' + league + ' tornou-se um membro');
      }).catch(function (error) {
        toastr.error(error);
      });
    };

    vm.addExtraPoints = function (user, points) {
      user.extraPoints = user.extraPoints || 0;
      user.extraPoints += points;

      if (user.extraPoints < 7) {
        userService.saveUser(user).then(function () {
          return scoreService.updateUserScores();
        }).then(function () {
          console.log("Recalculated");
        }).catch(function (err) {
          console.error(err);
        });
      } else {
        toastr.error("Máximo 6 pontos extras permitidos");
      }
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('RankingController', RankingController);

  RankingController.$inject = ['$window', 'userList', 'userService', 'adminService', 'scoreService', 'APP_CONFIG'];

  function RankingController($window, userList, userService, adminService, scoreService, APP_CONFIG) {
    var vm = this;

    vm.players = userList;
    vm.leagues = APP_CONFIG.leagues;
    vm.orderBy = 'name';
    vm.reverse = false;
    // vm.leagueFilter = vm.leagues[0];
    vm.userBets = {};

    vm.getObjSize = function (obj) {
      if (obj == null) return 0;else return Object.keys(obj).length;
    };

    vm.filterRanking = function (round) {
      // console.log('filterRanking: ' + round);

      vm.players.forEach(function (element) {
        // console.log(element.name)

        // console.log(element.bets.matches);
        // console.log(Object.values(element.bets.matches));
        var tmpScore = 0;
        Object.values(element.bets.matches).forEach(function (match) {
          if (match.points != undefined) {
            if (match.round == round || round == 'Todas') {
              // console.log(element.name + ' (' + element.uid + '): ' + match.round + ' -> ' + match.points);
              // console.log(element.name + ': ' + match.home + 'x' + match.away + '-> ' + match.points);
              tmpScore += match.points;
            }
          }
        });
        // console.log(element.name + '->' + tmpScore);
        element.totalScore = tmpScore;
      });
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('ConfigController', ConfigController);

  ConfigController.$inject = ['$window', 'user', 'userService', 'tournamentService'];

  function ConfigController($window, user, userService, tournamentService) {
    var vm = this;

    vm.tour = tournamentService.data.config;
    vm.user = user;
    vm.form = {};

    vm.editParam = function (param) {};

    vm.saveParam = function (param, newValue) {
      if (newValue && newValue !== user[param]) {
        user[param] = newValue;

        userService.saveUser(user).then(function (resp) {
          toastr.success('Configurações salvas!');
        }).catch(function (error) {
          toastr.error(error.message);
        });
      }

      vm.form[param] = false;
    };

    vm.changePassword = function (form) {
      var credentials = {
        email: user.email,
        newPassword: form.password,
        oldPassword: form.oldPassword
      };

      userService.changePassword(credentials).then(function (resp) {
        toastr.success("Elmentettük az új jelszavadat");
        vm.showPasswordChange = false;
      }).catch(function (error) {
        console.error(error);
      });
    };

    vm.reset = function (form) {
      form.$setPristine();
      form.$setUntouched();
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').directive('duplicate', duplicate);

  function duplicate() {
    return {
      require: 'ngModel',
      link: link
    };
  }

  function link(scope, element, attrs, controller) {
    controller.$validators.duplicate = function (modelValue, viewValue) {
      var prop = element.context.name;
      var teams = scope.teams.data.teams;

      if (controller.$isEmpty(modelValue)) {
        return true;
      }

      var check = teams.find(function (element) {
        return element[prop] === viewValue;
      });

      if (check) {
        return false;
      }
      return true;
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').controller('TeamDetailsController', TeamDetailsController);

  TeamDetailsController.$inject = ['team', 'tournamentService'];

  function TeamDetailsController(team, tournamentService) {
    var vm = this;

    var tour = tournamentService;

    vm.current = team;

    vm.data = tour.data;

    vm.addPlayers = function (team, players) {
      var playerArray = players.trim().split(',');

      tour.addPlayers(playerArray, team).then(function (resp) {
        toastr.success(team.longName + ': ' + resp.length + ' jogador adicionado');
      }).catch(function (error) {
        toastr.error(error);
      });
    };

    vm.removePlayer = function (player) {
      tour.removePlayer(player).then(function () {
        toastr.success(player.name + ' excluído');
      }).catch(function (error) {
        toastr.error(error);
      });
    };

    vm.reset = function (form) {
      vm.form = {};

      form.$setPristine();
      form.$setUntouched();
    };
  }
})();

(function () {
  'use strict';

  angular.module('admin').factory('adminService', adminService);

  adminService.$inject = ['$q', '$firebaseArray', '$firebaseObject', '$firebaseRef'];

  function adminService($q, $firebaseArray, $firebaseObject, $firebaseRef) {
    var pendingList = $firebaseArray($firebaseRef.pending);
    var promo = $firebaseObject($firebaseRef.promo);

    return {
      addNewEmails: addNewEmails,
      getPendingList: getPendingList,
      deletePending: deletePending,
      promo: promo,
      addPromoReply: addPromoReply
    };

    function addNewEmails(array, league) {
      var promises = [];

      return pendingList.$loaded().then(function (list) {
        array.forEach(function (email) {
          email = email.trim();

          var regexp = /^.*@.*\..*$/;

          var found = list.find(function (elem) {
            return elem.email === email;
          });

          if (regexp.test(email) && !found) {
            promises.push(list.$add({ email: email, league: league }));
          }
        });

        return $q.all(promises);
      });
    }

    function getPendingList() {
      return pendingList.$loaded();
    }

    function deletePending(item) {
      return pendingList.$remove(item);
    }

    function addPromoReply(promotion, user, answer) {
      return promo.$loaded().then(function (promoObj) {
        promoObj.users = promoObj.users || {};

        promoObj.users[user.uid] = promoObj.users[user.uid] || {};

        promoObj.users[user.uid][promotion.id] = answer;

        return promoObj.$save();
      });
    }
  }
})();

angular.module('bolaodaracaApp').run(['$templateCache', function ($templateCache) {
  'use strict';

  $templateCache.put('views/admin.html', "<div class=\"container\"> <ul class=\"nav nav-pills\"> <li role=\"presentation\" ng-class=\"{'active': admin.state.current.name == 'app.admin.matches'}\"> <a ui-sref=\"app.admin.matches\">Partidas</a></li> <li role=\"presentation\" ng-class=\"{'active': admin.state.current.name == 'app.admin.teamList' || admin.state.current.name == 'app.admin.teamDetails'  }\"> <a ui-sref=\"app.admin.teamList\">Equipes</a></li> <li role=\"presentation\" ng-class=\"{'active': admin.state.current.name == 'app.admin.participants'}\"> <a ui-sref=\"app.admin.participants\">Participantes</a></li> <li role=\"presentation\" ng-class=\"{'active': admin.state.current.name == 'app.admin.ranking'}\"> <a ui-sref=\"app.admin.ranking\">Ranking</a></li> <li role=\"presentation\" ng-class=\"{'active': admin.state.current.name == 'app.admin.configuration'}\"> <a ui-sref=\"app.admin.configuration\">Configurações</a></li> </ul> </div> <div class=\"inner-content\"> <ui-view></ui-view> </div>");

  $templateCache.put('views/bets.html', "<div class=\"container\"> <!-- Winner form --> <!--\n" + "\t<div class=\"jumbotron\" ng-if = \"bets.showTopForm\">\n" + "\t\t<div class=\"row\">\n" + "\t\t\t<div class=\"col-xs-12\">\n" + "\t\t\t\t<form class=\"\" name=\"topForm\" ng-submit=\"bets.addWinnerAndScorer(bets.topForm)\" autocomplete=\"off\">\n" + "\t\t\t\t\t<div class=\"form-group col-xs-12\">\n" + "\t\t\t\t\t\t<h2>Tippeld meg a győztest és a gólkirályt!</h2>\n" + "\t\t\t\t\t</div>\n" + "\t\t\t\t\t<div class=\"form-group col-xs-12 col-sm-6\" ng-class=\"{'has-error': topForm.winner.$invalid && topForm.winner.$touched}\">\n" + "\t\t\t\t\t\t<input\n" + "\t\t\t\t\t\t\trequired\n" + "\t\t\t\t\t\t\tname=\"winner\"\n" + "\t\t\t\t\t\t\tlist-to-validate = \"teams\" \n" + "\t\t\t\t\t\t\ttype=\"text\" \n" + "\t\t\t\t\t\t\tclass=\"form-control input-lg\" \n" + "\t\t\t\t\t\t\tuib-typeahead=\"team as team.longName for team in bets.data.teams | filter: {longName: $viewValue}\" \n" + "\t\t\t\t\t\t\tng-model=\"bets.topForm.winner\"\n" + "\t\t\t\t\t\t\tplaceholder=\"Győztes\"\n" + "\t\t\t\t\t\t\tng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\">\n" + "\t\t\t\t\t\t<div ng-messages = \"topForm.winner.$error\" ng-if=\"topForm.winner.$touched\">\n" + "\t\t\t\t\t\t\t<p class=\"help-block\" ng-message=\"required\">Ne felejtsd el megadni a győztest</p>\n" + "\t\t\t\t\t\t\t<p class=\"help-block\" ng-message=\"listToValidate\">Nincs ilyen csapat az adatbázisban</p>\n" + "\t\t\t\t\t\t</div>\n" + "\t\t\t\t\t</div>\n" + "\t\t\t\t\t<div class=\"form-group col-xs-12 col-sm-6\" ng-class=\"{'has-error': topForm.scorer.$invalid && topForm.scorer.$touched}\">\n" + "\t\t\t\t\t\t<input \n" + "\t\t\t\t\t\t\trequired\n" + "\t\t\t\t\t\t\tname=\"scorer\"\n" + "\t\t\t\t\t\t\ttype=\"text\" \n" + "\t\t\t\t\t\t\tclass=\"form-control input-lg\"\n" + "\t\t\t\t\t\t\tng-model=\"bets.topForm.topScorer\"\n" + "\t\t\t\t\t\t\tplaceholder=\"Gólkirály\"\n" + "\t\t\t\t\t\t\tng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\">\n" + "\t\t\t\t\t\t<div ng-messages = \"topForm.scorer.$error\" ng-if=\"topForm.scorer.$touched\">\n" + "\t\t\t\t\t\t\t<p class=\"help-block\" ng-message=\"required\">Ne felejtsd el megadni a gólkirályt</p>\n" + "\t\t\t\t\t\t</div>\n" + "\t\t\t\t\t</div>\n" + "\t\t\t\t\t<div class=\"form-group col-xs-12 col-sm-12\">\n" + "\t\t\t\t\t\t<p class=\"help-block\">Ezeket a tippeket az első meccs kezdetéig még akármikor módosíthatod.</p>\n" + "\t\t\t\t\t</div>\n" + "\t\t\t\t\t<div class=\"form-group col-xs-12 col-sm-12\">\n" + "\t\t\t\t\t\t<span class=\"pull-right\">\n" + "\t\t\t\t\t\t\t<button type=\"reset\" class=\"btn btn-lg btn-default\" ng-click = \"bets.showTopForm = false\">Mégse</button>\n" + "\t\t\t\t\t\t\t<button type=\"submit\" class=\"btn btn-lg btn-primary\" ng-disabled=\"topForm.$invalid\">Mentés</button>\n" + "\t\t\t\t\t\t</span>\n" + "\t\t\t\t\t</div>\n" + "\t\t\t\t</form>\n" + "\t\t\t</div>\n" + "\t\t</div>\n" + "\t</div>\n" + "--> <!-- Winner bets --> <!--\n" + "\t<div class=\"row\" ng-if=\"!bets.showTopForm\">\n" + "\n" + "\t\t<div class=\"col-xs-12 well\" ng-show=\"bets.user.bets.winner || bets.user.bets.topScorer\">\n" + "\t\t\t<strong ng-show=\"bets.user.bets.winner || bets.user.bets.topScorer\">Favoritok:</strong> \n" + "\t\t\t<span ng-show=\"bets.user.bets.winner\">\n" + "\t\t\t\t<span class=\"flag-icon\" ng-class=\"{'flag-icon-{{bets.user.bets.winner.ISO}}': true}\"></span> <strong>{{bets.user.bets.winner.longName}}</strong> lesz az Európa-bajnok, és\n" + "\t\t\t</span>\n" + "\t\t\t<span ng-show=\"bets.user.bets.topScorer\">\n" + "\t\t\t\t<strong>{{bets.user.bets.topScorer}}</strong> a gólkirály.\n" + "\t\t\t</span>\n" + "\t\t\t<a ng-show=\"bets.now < bets.startTime - bets.timeLimit\" href class=\"pull-right\" ng-click=\"bets.showTopForm = true; bets.loadBets()\">Módosítom</a>\n" + "\t\t</div>\n" + "\t--> <!-- Empty state --> <!--\n" + "\t\t<div class=\"alert alert-danger\" ng-hide=\"bets.user.bets.winner || bets.user.bets.topScorer || bets.now > bets.startTime - bets.timeLimit\">\n" + "\t\t\t<span>\n" + "\t\t\t\tNem tippeltél a győztesre és a gólkirályra! \n" + "\t\t\t</span>\n" + "\t\t\t<a href class=\"alert-link\" ng-click=\"bets.showTopForm = true\">Kattints ide a tippeléshez!</a>\n" + "\t\t</div>\n" + "\t</div>\n" + "--> <!-- Match bets --> <div class=\"row\"> <div class=\"col-xs-12\"> <ul class=\"nav nav-tabs\"> <li role=\"presentation\" ng-class=\"{'active': bets.onlyOpen}\"> <a href ng-click=\"bets.onlyOpen = true\">Meus Palpites</a> </li> <li role=\"presentation\" ng-class=\"{'active': !bets.onlyOpen}\"> <a href ng-click=\"bets.onlyOpen = false\">Jogos Encerrados</a> </li> </ul> </div> <div class=\"col-xs-12\"> <h3 ng-show=\"bets.onlyOpen\"><small>Você pode alterar seus palpites até <b>{{bets.timeLimit / 60000}} minutos</b> antes do início da partida. Clique no campo ao lado do jogo para alterá-lo!</small></h3> <h3 ng-hide=\"bets.onlyOpen\"><small>Você não pode mais mudar estes palpites. Quando o resultado de partida for lançado, você verá a sua pontuação.</small></h3> </div> <div class=\"col-xs-12 match-block\" ng-repeat=\"match in bets.data.matches | orderBy: 'datetime' : !bets.onlyOpen | open: bets.onlyOpen : bets.now\"> <div class=\"col-sm-10\"> <h4> <span class=\"label label-info\" ng-show=\"bets.now < match.datetime - bets.timeLimit && !match.result\"><span class=\"glyphicon glyphicon-pencil\"></span> Aberto</span> <span class=\"label label-default\" ng-show=\"bets.now > match.datetime - bets.timeLimit && !match.result\"><span class=\"glyphicon glyphicon-ban-circle\"></span> Fechado</span> <span class=\"label label-primary\" ng-show=\"match.result\"><span class=\"glyphicon glyphicon-ok\"></span> Resultado</span> <small ng-show=\"bets.now < match.datetime - bets.timeLimit && !match.result\"> {{match.datetime | date: 'dd/MM H:mm'}}</small> <!-- <small> {{match.datetime | date: 'dd/MM H:mm'}}</small> --> </h4> </div> <div class=\"col-sm-10 hidden-xs\"> <h3> <small>{{match.group}} | {{match.round}} | {{match.location}}</small> <br> <span ng-show=\"match.home.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.home.ISO}}': true}\"></span> <img ng-show=\"match.home.iconImg!=''\" class=\"teamIcon30\" ng-src=\"images/teams/{{match.home.iconImg}}\"> {{match.home.longName}} x {{match.away.longName}} <img ng-show=\"match.away.iconImg!=''\" class=\"teamIcon30\" ng-src=\"images/teams/{{match.away.iconImg}}\"> <span ng-show=\"match.away.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.away.ISO}}': true}\"></span> </h3> </div> <div class=\"col-sm-10 visible-xs-block text-center\"> <h3> <small>{{match.group}} | {{match.round}} | {{match.location}}</small> <br> <span ng-show=\"match.home.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.home.ISO}}': true}\"></span> <img ng-show=\"match.home.iconImg!=''\" class=\"teamIcon30\" ng-src=\"images/teams/{{match.home.iconImg}}\"> {{match.home.longName}} <br> x <br> <img ng-show=\"match.away.iconImg!=''\" class=\"teamIcon30\" ng-src=\"images/teams/{{match.away.iconImg}}\"> <span ng-show=\"match.away.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.away.ISO}}': true}\"></span> {{match.away.longName}} </h3> </div> <div class=\"col-xs-12 col-sm-2 text-center\"> <h3 ng-hide=\"bets.now > match.datetime - bets.timeLimit || match.result\"> <small ng-show=\"bets.user.bets.matches[match.$id]\"> Alterar Palpite</small> <br> <a href ng-click=\"bets.inputs[match.$id] = true; bets.loadMatchBet(bets.user.bets.matches[match.$id], match.$id)\" ng-hide=\"bets.inputs[match.$id]\"> <span ng-show=\"bets.user.bets.matches[match.$id]\"> {{bets.user.bets.matches[match.$id].home}} x {{bets.user.bets.matches[match.$id].away}} </span> </a> <small ng-show=\"!bets.user.bets.matches[match.$id]\">Informe o Palpite</small> <input ng-if=\"bets.inputs[match.$id] || !bets.user.bets.matches[match.$id]\" name=\"matchBet\" size=\"3\" class=\"form-control bet-input\" type=\"text\" eb-focus=\"bets.inputs[match.$id]\" ng-model=\"bets.matchBet[match.$id]\" ng-blur=\"bets.updateBet(bets.matchBet[match.$id], match.$id)\" placeholder=\"Formato: 0x0\" ng-keypress=\"bets.submitBetOnEnter($event, bets.matchBet[match.$id], match.$id)\"> </h3> <h3 ng-show=\"bets.now > match.datetime - bets.timeLimit && !match.result\"> <span ng-show=\"bets.user.bets.matches[match.$id]\"> <small>Palpite: {{bets.user.bets.matches[match.$id].home}} x {{bets.user.bets.matches[match.$id].away}} </small> </span> <small ng-hide=\"bets.user.bets.matches[match.$id]\">(Não palpitou)</small> </h3> <h3> <span class=\"label label-success\" ng-show=\"bets.user.bets.matches[match.$id].points\"><span class=\"glyphicon glyphicon-ok\"></span> {{bets.user.bets.matches[match.$id].points}} pontos</span> <span class=\"label label-default\" ng-hide=\"bets.user.bets.matches[match.$id].points || !match.result\"><span class=\"glyphicon glyphicon-remove\"></span> 0 pontos</span> </h3> </div> <div class=\"col-xs-12\"> <h5 ng-show=\"match.result\" class=\"help-block\"> {{match.result.home}} x {{match.result.away}} <span ng-show=\"bets.user.bets.matches[match.$id]\"> (Palpite: {{bets.user.bets.matches[match.$id].home}} x {{bets.user.bets.matches[match.$id].away}}) </span> <span ng-hide=\"bets.user.bets.matches[match.$id]\">(Não palpitou)</span> </h5> </div> </div> </div> </div>");

  $templateCache.put('views/configuration.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12\"> <h3>Configurações</h3> <hr> <h5> <span class=\"glyphicon glyphicon-user text-info\"></span> <strong>Limite para Palpitar</strong> </h5> <span ng-hide=\"config.betTimeLimit\">{{config.tour.data.betTimeLimit}} <small> <a href ng-click=\"config.editParam('betTimeLimit')\">(Alterar)</a> </small> </span> <form class=\"form-horizontal\" ng-submit=\"config.saveParam('betTimeLimit',config.betTimeLimit)\" ng-show=\"config.tour.data.betTimeLimit\"> <div class=\"form-group\"> <div class=\"col-xs-8 col-sm-6 col-lg-3\"> <input type=\"text\" class=\"form-control\" ng-model=\"config.tour.data.betTimeLimit\" ng-blur=\"config.saveParam('betTimeLimit',config.tour.data.betTimeLimit)\"> </div> <button type=\"submit\" class=\"btn btn-primary\">Salvar</button> </div> </form> <hr> <!-- <h5>\n" + "\t\t\t\t<span class=\"glyphicon glyphicon-briefcase text-info\"></span>\n" + "\t\t\t\t<strong>Empresa </strong>\n" + "\t\t\t</h5>\n" + "\t\t\t\t<span ng-hide=\"profile.form.company\">{{profile.user.company}}\n" + "\t\t\t\t<small>\n" + "\t\t\t\t\t<a href ng-click=\"profile.editParam('company')\">(Alterar)</a>\n" + "\t\t\t\t</small>\n" + "\t\t\t\t</span>\n" + "\n" + "\t\t\t<form class=\"form-horizontal\" ng-submit=\"profile.saveParam('company',profile.form.company)\" ng-show=\"profile.form.company\">\n" + "\t\t\t\t<div class=\"form-group\">\n" + "\t\t\t\t\t<div class=\"col-xs-8 col-sm-6 col-lg-3\">\n" + "\t\t\t\t\t\t<input type=\"text\" class=\"form-control\" ng-model=\"profile.form.company\" ng-blur=\"profile.saveParam('company',profile.form.company)\">\t\t\n" + "\t\t\t\t\t</div>\n" + "\t\t\t\t\t<button type=\"submit\" class=\"btn btn-primary\">Salvar</button>\n" + "\t\t\t\t</div>\n" + "\t\t\t</form>\n" + "\t\t\t<hr>\n" + "\t\t</div>\n" + "\t\t\n" + "\t\t<div class=\"col-xs-12\">\n" + "\t\t\t<h4>Alterar senha</h4>\n" + "\t\t\t<a href ng-click=\"profile.showPasswordChange = true\" ng-hide=\"profile.showPasswordChange\">Quero alterar a minha senha</a>\n" + "\t\t\t\n" + "\n" + "\t\t\t<form name=\"passForm\" ng-if=\"profile.showPasswordChange\" class=\"col-xs-4\">\n" + "\n" + "\t\t\t\t<div class=\"form-group\" ng-class=\"{'has-error': passForm.oldPassword.$touched && passForm.oldPassword.$invalid, 'has-success': passForm.oldPassword.$dirty && passForm.oldPassword.$touched}\">\n" + "\t\t\t\t    <div class=\"input-group\">\n" + "\t\t\t\t    \t<div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div>\n" + "\t\t\t\t\t\t<input \n" + "\t\t\t\t\t\t\trequired\n" + "\t\t\t\t\t\t\ttype=\"password\" \n" + "\t\t\t\t\t\t\tclass=\"form-control\" \n" + "\t\t\t\t\t\t\tid=\"passwordInput\" \n" + "\t\t\t\t\t\t\tname=\"oldPassword\" \n" + "\t\t\t\t\t\t\tng-model=\"form.oldPassword\" \n" + "\t\t\t\t\t\t\tplaceholder=\"Senha atual\"\n" + "\t\t\t\t\t\t\tng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\">\n" + "\t\t\t\t    </div>\n" + "\t\t\t\t    <div ng-messages=\"passForm.oldPassword.$error\" ng-if=\"passForm.oldPassword.$touched\">\n" + "\t\t\t\t    \t<p class=\"help-block\" ng-message=\"required\">Campo Obrigatório</p>\n" + "\t\t\t\t    </div>\n" + "\t\t\t\t</div>\n" + "\n" + "\t\t\t\t<div class=\"form-group\" ng-class=\"{'has-error': passForm.password.$touched && passForm.password.$invalid,'has-success': passForm.password.$dirty && passForm.password.$touched}\">\n" + "\t\t\t\t    <div class=\"input-group\">\n" + "\t\t\t\t    \t<div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div>\n" + "\t\t\t\t\t\t<input \n" + "\t\t\t\t\t\t\trequired\n" + "\t\t\t\t\t\t\tminlength=\"6\" \n" + "\t\t\t\t\t\t\ttype=\"password\" \n" + "\t\t\t\t\t\t\tclass=\"form-control\" \n" + "\t\t\t\t\t\t\tid=\"passwordInput\" \n" + "\t\t\t\t\t\t\tname=\"password\" \n" + "\t\t\t\t\t\t\tng-model=\"form.password\" \n" + "\t\t\t\t\t\t\tplaceholder=\"Nova senha\"\n" + "\t\t\t\t\t\t\tng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\">\n" + "\t\t\t\t    </div>\n" + "\t\t\t\t    <div ng-messages=\"passForm.password.$error\" ng-if=\"passForm.password.$touched\">\n" + "\t\t\t\t    \t<p class=\"help-block\" ng-message=\"required\">Senha requerida</p>\n" + "\t\t\t\t    \t<p class=\"help-block\" ng-message=\"minlength\">A senha deve ter pelo menos 6 caracteres</p>\n" + "\t\t\t\t    </div>\n" + "\t\t\t\t</div> --> <!-- Password check --> <!-- <div class=\"form-group\" ng-class=\"{'has-error': form.password !== form.passwordCheck && passForm.passwordCheck.$touched, 'has-success': form.password === form.passwordCheck && passForm.passwordCheck.$dirty}\">\n" + "\t\t\t\t    <div class=\"input-group\">\n" + "\t\t\t\t    \t<div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div>\n" + "\t\t\t\t\t\t<input \n" + "\t\t\t\t\t\t\trequired \n" + "\t\t\t\t\t\t\ttype=\"password\" \n" + "\t\t\t\t\t\t\tclass=\"form-control\" \n" + "\t\t\t\t\t\t\tid=\"passwordInput\" \n" + "\t\t\t\t\t\t\tname=\"passwordCheck\" \n" + "\t\t\t\t\t\t\tng-model=\"form.passwordCheck\" \n" + "\t\t\t\t\t\t\tplaceholder=\"Confirme a nova senha\"\n" + "\t\t\t\t\t\t\tng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"\n" + "\t\t\t\t\t\t\tng-disabled=\"passForm.password.$invalid\">\n" + "\t\t\t\t    </div>\n" + "\t\t\t\t\t<div class=\"help-block\" ng-show=\"form.password !== form.passwordCheck && passForm.passwordCheck.$touched\">As senhas informadas são diferentes</div>\n" + "\t\t\t\t</div>\n" + "\t\t\t\t<button class=\"btn btn-primary\" ng-click=\"profile.changePassword(form)\">Salvar</button>\n" + "\t\t\t\t<button class=\"btn btn-default\" ng-click=\"profile.showPasswordChange=false; profile.reset(passForm)\">Cancelar</button>\n" + "\t\t\t</form>\t\t\t --> </div> <!-- <div class=\"col-xs-12\" ng-hide=\"profile.showPassword\">\n" + "\t\t\t<hr>\n" + "\t\t\t<button class=\"btn btn-danger\" ng-click=\"profile.showPassword = true\">Excluir perfil</button>\n" + "\t\t\t<span class=\"text-danger\"><strong>&nbsp ATENÇÃO! </strong> Isto irá eliminá-lo do jogo. Todos os seus palpites e sua pontuação serão perdidos.</span>\n" + "\t\t</div>\n" + "\t\t<form class=\"col-md-6 cl-lg-3\" ng-show=\"profile.showPassword\" name=\"passwordForm\">\n" + "\t\t\t<hr>\n" + "\t\t\t<div class=\"form-group\">\n" + "\t\t\t\t<label>Senha</label>\n" + "\t\t\t\t<input type=\"password\" class=\"form-control\" ng-model=\"profile.form.password\" eb-focus=\"profile.showPassword\" required>\n" + "\t\t\t</div>\n" + "\t\t\t<button class=\"btn btn-danger\" ng-click=\"profile.deleteProfile(profile.form.password)\" ng-disabled = \"passwordForm.$invalid\">Desejo excluir meu perfil</button>\n" + "\t\t</form> --> </div> </div>");

  $templateCache.put('views/contact.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12\"> <h4>Valami nem működik? Fejlesztési ötleted van? Írj nekünk!</h4> <a href=\"mailto: norbert.cinkotai@kbcsecurities.hu\">norbert.cinkotai@kbcsecurities.hu</a><br> <a href=\"mailto: andras.somi@kbcsecurities.hu\">andras.somi@kbcsecurities.hu</a> </div> </div> </div>");

  $templateCache.put('views/dashboard.html', "<div class=\"container\"> <div class=\"row\"> <!-- <div ng-if=\"dashboard.showPromo(dashboard.promo.current, dashboard.user)\">\n" + "\t\t\t<div class=\"col-xs-12 promobox bg-warning text-warning\">\n" + "\t\t\t\t<h3></span> {{dashboard.promo.current.title}}</h3>\n" + "\t\t\t\t<p>{{dashboard.promo.current.message}}</p>\n" + "\t\t\t\t<a class=\"btn btn-success\" ng-hide=\"dashboard.promo.users[dashboard.user.uid]\" href ng-click=\"dashboard.replyToPromo(dashboard.promo.current, dashboard.user, true)\">Estou chegando!</a>\n" + "\t\t\t\t<em ng-show=\"dashboard.promo.users[dashboard.user.uid]\">Você marcou que está vindo <a href ng-click=\"dashboard.replyToPromo(dashboard.promo.current, dashboard.user, null)\">Não estou indo</a></em>\t\t\t\n" + "\t\t\t</div>\t\n" + "\t\t</div> --> <div class=\"col-xs-12 col-md-6\"> <div class=\"row\"> <div class=\"col-xs-12\"> <div class=\"panel panel-info\" ng-class=\"{'panel-info': dashboard.user.bets, 'panel-warning': !dashboard.user.bets}\"> <div class=\"panel-heading\"> <h3 class=\"panel-title\"> <span class=\"glyphicon glyphicon-calendar\"></span> Próximos Jogos </h3> </div> <div class=\"panel-body\" ng-class=\"{'bg-warning': !dashboard.user.bets}\"> <div class=\"match-entry\" ng-repeat=\"match in dashboard.tour.data.matches | orderBy: 'datetime' : true | open: false | noResult | limitTo: 2 as currentMatches\"> <span class=\"label label-danger\" ng-show=\"dashboard.now > match.datetime - dashboard.timeLimit\">ENCERRADO</span><small> {{match.datetime | date: 'dd/MM H:mm'}} | {{match.location}}</small><br> <span ng-show=\"match.home.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.home.ISO}}': true}\"></span> <img ng-show=\"match.home.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.home.iconImg}}\"> <a ui-sref=\"app.match({matchId: match.$id})\"> <span class=\"hidden-xs\">{{match.home.longName}} x {{match.away.longName}}</span> <span class=\"visible-xs-inline\">{{match.home.shortName}} x {{match.away.shortName}}</span> </a> <img ng-show=\"match.away.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.away.iconImg}}\"> <span ng-show=\"match.away.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.away.ISO}}': true}\"></span> <strong class=\"pull-right\" ng-show=\"dashboard.user.bets.matches[match.$id]\"> {{dashboard.user.bets.matches[match.$id].home}} x {{dashboard.user.bets.matches[match.$id].away}} </strong> <strong class=\"pull-right text-danger\" ng-hide=\"dashboard.user.bets.matches[match.$id]\"> <span class=\"glyphicon glyphicon-flash\"></span> <span class=\"hidden-xs\">Não palpitou</span> </strong> </div> <div class=\"match-entry\" ng-repeat=\"match in dashboard.tour.data.matches | orderBy: 'datetime' | open: true | limitTo: 4 - currentMatches.length\" ng-show=\"dashboard.user.bets\"> <span class=\"label label-warning\" ng-show=\"dashboard.now + 7200000 > match.datetime\">ENCERRANDO (2 horas)</span><small> {{match.datetime | date: 'dd/MM H:mm'}} | {{match.location}}</small><br> <span ng-show=\"match.home.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.home.ISO}}': true}\"></span> <img ng-show=\"match.home.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.home.iconImg}}\"> <span class=\"hidden-xs\">{{match.home.longName}} x {{match.away.longName}}</span> <span class=\"visible-xs-inline\">{{match.home.shortName}} x {{match.away.shortName}}</span> <img ng-show=\"match.away.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.away.iconImg}}\"> <span ng-show=\"match.away.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.away.ISO}}': true}\"></span> <strong class=\"pull-right\" ng-show=\"dashboard.user.bets.matches[match.$id]\"> {{dashboard.user.bets.matches[match.$id].home}} x {{dashboard.user.bets.matches[match.$id].away}} </strong> <strong class=\"pull-right text-danger\" ng-hide=\"dashboard.user.bets.matches[match.$id]\"> <span class=\"glyphicon glyphicon-flash\"></span> <span class=\"hidden-xs\">Não palpitou</span> </strong> </div> <div class=\"text-center\"> <button class=\"btn btn-primary\" ui-sref=\"app.myBets({filter: true})\" ng-show=\"dashboard.user.bets\">Palpites Em Aberto</button> <button class=\"btn btn-warning\" ui-sref=\"app.myBets({filter: true})\" ng-hide=\"dashboard.user.bets\">Cadastrar Palpites!</button> </div> </div> </div> </div> <div class=\"col-xs-12\"> <div class=\"panel panel-default\"> <div class=\"panel-heading\"> <h3 class=\"panel-title\"> <span class=\"glyphicon glyphicon-ok-circle\"></span> Últimas Pontuações</h3> </div> <div class=\"panel-body\"> <div ng-hide=\"matches.length\" class=\"empty-state-message text-center\"> Aqui você verá seus pontos recentemente somados. </div> <div class=\"player-entry\" ng-repeat=\"match in dashboard.tour.data.matches | orderBy: 'datetime' : true | result | limitTo: 4 as matches\"> <span ng-show=\"match.home.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.home.ISO}}': true}\"></span> <img ng-show=\"match.home.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.home.iconImg}}\"> <a ui-sref=\"app.match({matchId: match.$id})\"> <span class=\"hidden-xs\">{{match.home.longName}} x {{match.away.longName}}</span> <span class=\"visible-xs-inline\">{{match.home.shortName}} x {{match.away.shortName}}</span> </a> <img ng-show=\"match.away.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.away.iconImg}}\"> <span ng-show=\"match.away.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.away.ISO}}': true}\"></span> <span class=\"pull-right point-label\"> <span class=\"label label-success\" ng-show=\"dashboard.user.bets.matches[match.$id].points\"><span class=\"glyphicon glyphicon-ok\"></span> {{dashboard.user.bets.matches[match.$id].points}} pontos</span> <span class=\"label label-default\" ng-hide=\"dashboard.user.bets.matches[match.$id].points || !match.result\"><span class=\"glyphicon glyphicon-remove\"></span> 0 pontos</span> </span> </div> <div class=\"text-center\"> <button class=\"btn btn-primary\" ui-sref=\"app.myBets({filter:false})\">Jogos Encerrados</button> </div> </div> </div> </div> </div> </div> <div class=\"col-xs-12 col-md-6\"> <div class=\"panel panel-success\"> <div class=\"panel-heading\"> <h3 class=\"panel-title\"> <span class=\"glyphicon glyphicon-star-empty\"></span> Ranking Geral </h3> <!-- <small>\n" + "\t\t\t\t\t\t<form class=\"form-inline\">\n" + "\t\t\t\t\t\t\t<label for=\"filter\">Filtrar por Rodada</label>\n" + "\t\t\t\t\t\t\t<select id=\"filter\" ng-model=\"filter\" class=\"form-control\">\n" + "\t\t\t\t\t\t\t\t<option selected>Todas</option>\n" + "\t\t\t\t\t\t\t\t<option>Rodada 1</option>\n" + "\t\t\t\t\t\t\t\t<option>Rodada 2</option>\n" + "\t\t\t\t\t\t\t\t<option>Rodada 3</option>\n" + "\t\t\t\t\t\t\t\t<option>Oitavas de Final</option>\t\t\t\t\t\t\t\t\t\n" + "\t\t\t\t\t\t\t\t<option>Quartas de Final</option>\n" + "\t\t\t\t\t\t\t\t<option>Semifinais</option>\n" + "\t\t\t\t\t\t\t\t<option>Finais</option>\n" + "\t\t\t\t\t\t\t</select>\n" + "\t\t\t\t\t\t\t<button class=\"btn btn-success\" ng-click=\"ranking.filterRanking(filter)\">Filtrar</button>\n" + "\t\t\t\t\t\t</form>\n" + "\t\t\t\t\t</small> --> </div> <div class=\"panel-body\"> <ul class=\"nav nav-tabs\" ng-if=\"dashboard.user.league[1]\"> <li role=\"presentation\" ng-class=\"{'active': dashboard.leagueFilter === league}\" ng-repeat=\"league in dashboard.user.league\"><a href ng-click=\"dashboard.leagueFilter = league\">{{league}}</a></li> </ul> <div class=\"player-entry\" ng-repeat=\"player in dashboard.users | orderBy: ['score', '-name'] : true | league: dashboard.leagueFilter track by player.uid\" ng-class=\"{'text-info player-bold': dashboard.user.uid === player.uid}\"> <span class=\"player-position\"> {{$index +1}} </span> <span> <span class=\"glyphicon glyphicon-star-empty\" ng-hide=\"dashboard.user.uid === player.uid\" style=\"color: #fff\"></span> <span class=\"glyphicon glyphicon-star\" ng-show=\"dashboard.user.uid === player.uid\"></span> <a ui-sref=\"app.public({uid: player.uid})\">{{player.name}}</a> </span> <span class=\"pull-right\"> {{player.score}} pontos </span> <hr> </div> </div> <div class=\"panel-footer\"> <a ui-sref=\"app.rules\"> <span class=\"glyphicon glyphicon-question-sign\"></span> Como funciona a pontuação? </a> </div> </div> </div> <!-- <div class=\"col-xs-12 col-md-12\" ng-show=\"false\"> --> <!-- ng-show=\"dashboard.user.admin\"> --> <!-- <table class=\"table table-striped\">\n" + "\t\t\t\t<thead>\n" + "\t\t\t\t\t<tr>\n" + "\t\t\t\t\t\t<th scope=\"col\">#</th>\n" + "\t\t\t\t\t\t<th scope=\"col\">Nome</th>\n" + "\t\t\t\t\t\t<th scope=\"col\">Palpites</th>\n" + "\t\t\t\t\t\t<th scope=\"col\">Pontuação</th>\n" + "\t\t\t\t\t</tr>\n" + "\t\t\t\t</thead>\n" + "\t\t\t\t<tbody>\n" + "\t\t\t\t\t<tr ng-repeat=\"player in dashboard.users | orderBy: 'score' : true | league: dashboard.leagueFilter track by player.uid\" >\n" + "\t\t\t\t\t\t<td>{{$index +1}}</td>\n" + "\t\t\t\t\t\t<td>{{player.name}}</td>\n" + "\t\t\t\t\t\t<td>{{dashboard.getObjSize(player.bets.matches)}}</td>\n" + "\t\t\t\t\t\t<td>{{player.score}}</td>\n" + "\t\t\t\t\t</tr>\n" + "\t\t\t\t</tbody>\n" + "\t\t\t</table>\n" + "\t\t</div> --> </div> </div>");

  $templateCache.put('views/footer.html', "<footer class=\"eb-footer\"> <div class=\"container\"> <p>Bolão da Raça - 2018</p> <!-- <a href ui-sref=\"app.contact\">Contato</a> --> </div> </footer>");

  $templateCache.put('views/login.html', "<div class=\"container\"> <div class=\"row\"> <img src=\"images/b12.jpg\" class=\"img-responsive\"> </div> <div class=\"row\"> <div class=\"col-xs-12 col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3\"> <!-- <div class=\"col-xs-12 col-sm-8 col-lg-6 user-form\"> --> <form name=\"loginForm\" class=\"form\" ng-submit=\"login.login(login.form)\"> <center><h4>Bolão da Raça - Login</h4></center> <div class=\"form-group\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-envelope\"></span></div> <input type=\"text\" class=\"form-control\" name=\"email\" placeholder=\"Email\" ng-model=\"login.form.email\" required> </div> </div> <div class=\"form-group\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input type=\"password\" class=\"form-control\" name=\"password\" placeholder=\"Senha\" ng-model=\"login.form.password\" required> </div> </div> <div class=\"form-group\"> <button type=\"submit\" class=\"btn btn-primary btn-block\" ng-disabled=\"loginForm.$invalid || login.loading\"> <span ng-hide=\"login.loading\">Entrar</span> <span ng-show=\"login.loading\">Efetuando login...</span> </button> <div class=\"text-center\"> <br> <a ui-sref=\"reset\">Esqueci minha senha.</a> </div> <hr> <div class=\"col-xs-12\"> <p class=\"text-center\">Caso ainda não tenha cadastro, clique para se <a ui-sref=\"register\">cadastrar agora!</a></p> </div> </div> </form> </div> </div> </div>");

  $templateCache.put('views/match.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12\" ng-show=\"matches.uploadForm\"> <h4>Importar partidas</h4> <form name=\"matchesForm\" ng-submit=\"matches.upload(matches.form.list, matchesForm)\"> <div class=\"form-group\"> <label>Lista de jogos</label> <textarea required class=\"form-control\" name=\"matchList\" id=\"matchList\" cols=\"30\" rows=\"10\" placeholder=\"Formato: Grupo; Rodada; Data; Código Casa; Código Visitante\" ng-model=\"matches.form.list\"></textarea> </div> <p class=\"help-block\" ng-show=\"matchesForm.matchList.$touched && matchesForm.matchList.$invalid\">Copie dos dados da Partida!</p> <button class=\"btn btn-primary\" type=\"submit\" ng-disabled=\"matchesForm.$invalid\">Importar</button> <button class=\"btn btn-default\" type=\"reset\" ng-click=\"matches.uploadForm=false; matches.reset(matchesForm)\">Cancelar</button> </form> </div> <div class=\"col-xs-12\" ng-hide=\"matches.uploadForm\"> <form> <div class=\"form-group\"> <label for=\"filter\">Filtro</label> <input type=\"text\" class=\"form-control\" name=\"filter\" ng-model=\"matches.table.filter\" placeholder=\"Digite o nome ou apelido da equipe\"></div> </form> <table class=\"table table-hover\"> <thead> <th class=\"text-center col-xs-2\" ng-click=\"matches.table.sortColumn = 'group'; matches.table.reverse = !matches.table.reverse\"> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"matches.table.sortColumn == 'group' && matches.table.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"matches.table.sortColumn == 'group' && !matches.table.reverse\"></span> Grupo</th> <th class=\"text-center col-xs-2\">Rodada</th> <th class=\"text-center col-xs-3\" ng-click=\"matches.table.sortColumn = 'datetime'; matches.table.reverse = !matches.table.reverse\"> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"matches.table.sortColumn == 'datetime' && matches.table.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"matches.table.sortColumn == 'datetime' && !matches.table.reverse\"></span> Data</th> <th class=\"text-center col-xs-3\">Equipes</th> <th class=\"text-center col-xs-2\">Placar</th> </thead> <tr class=\"text-center\" ng-repeat=\"match in matches.data.matches | orderBy: matches.table.sortColumn : matches.table.reverse | filter: matches.table.filter\"> <td>{{match.group}}</td> <td>{{match.round}}</td> <td class=\"text-center\">{{match.datetime | date : 'dd/MM H:mm'}} | {{match.location}}</td> <td class=\"text-center\">{{match.home.longName}} x {{match.away.longName}}</td> <td class=\"text-center\"> <div ng-hide=\"matches.table.editResult == match.$id\" ng-click=\"matches.table.editResult = match.$id\"> <span ng-show=\"match.result.home\">{{match.result.home}}x{{match.result.away}}</span> <span class=\"glyphicon glyphicon-pencil\"></span> </div> <form ng-if=\"matches.table.editResult == match.$id\" name=\"resultForm\" class=\"form-inline\" ng-submit=\"matches.updateResult(match, matches.table.result[match.$id])\"> <div class=\"form-group\"> <input autofocus eb-focus=\"matches.table.editResult === match.$id\" size=\"3\" type=\"text\" class=\"form-control\" ng-model=\"matches.table.result[match.$id]\"> <a href ng-click=\"matches.table.editResult = false\">Cancelar</a> </div> </form> </td> </tr> </table> </div> <div class=\"col-xs-12\" ng-hide=\"matches.uploadForm\"> <a href ng-click=\"matches.uploadForm = true\"><span class=\"glyphicon glyphicon-plus\"></span> Importar partidas...</a> </div> </div> </div>");

  $templateCache.put('views/matches.html', "<div class=\"container\"> <div class=\"row\"> <!-- \t<a ng-click=\"matches.updateResults()\">Atualizar Ranking</a> --> <button class=\"btn btn-success\" ng-click=\"matches.updateResults()\">Atualizar Ranking</button> <hr> <div class=\"col-xs-12\" ng-show=\"matches.uploadForm\"> <h4>Importar partidas</h4> <form name=\"matchesForm\" ng-submit=\"matches.upload(matches.form.list, matchesForm)\"> <div class=\"form-group\"> <label>Lista de jogos</label> <textarea required class=\"form-control\" name=\"matchList\" id=\"matchList\" cols=\"30\" rows=\"10\" placeholder=\"Formato: Grupo; Data; Local; Código Casa; Código Visitante\" ng-model=\"matches.form.list\"></textarea> </div> <p class=\"help-block\" ng-show=\"matchesForm.matchList.$touched && matchesForm.matchList.$invalid\">Copie dos dados da Partida!</p> <button class=\"btn btn-primary\" type=\"submit\" ng-disabled=\"matchesForm.$invalid\">Importar</button> <button class=\"btn btn-default\" type=\"reset\" ng-click=\"matches.uploadForm=false; matches.reset(matchesForm)\">Cancelar</button> </form> </div> <div class=\"col-xs-12\" ng-hide=\"matches.uploadForm\"> <form> <div class=\"form-group\"> <label for=\"filter\">Filtro</label> <input type=\"text\" class=\"form-control\" name=\"filter\" ng-model=\"matches.table.filter\" placeholder=\"Digite o nome longo ou curto da equipe\"></div> </form> <table class=\"table table-hover\"> <thead> <th class=\"text-center col-xs-2\" ng-click=\"matches.table.sortColumn = 'group'; matches.table.reverse = !matches.table.reverse\"> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"matches.table.sortColumn == 'group' && matches.table.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"matches.table.sortColumn == 'group' && !matches.table.reverse\"></span> Grupo</th> <th class=\"text-center col-xs-2\">Rodada</th> <th class=\"text-center col-xs-3\" ng-click=\"matches.table.sortColumn = 'datetime'; matches.table.reverse = !matches.table.reverse\"> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"matches.table.sortColumn == 'datetime' && matches.table.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"matches.table.sortColumn == 'datetime' && !matches.table.reverse\"></span> Data</th> <th class=\"text-center col-xs-3\">Equipes</th> <th class=\"text-center col-xs-2\">Placar</th> </thead> <tr class=\"text-center\" ng-repeat=\"match in matches.data.matches | orderBy: matches.table.sortColumn : matches.table.reverse | filter: matches.table.filter\"> <td>{{match.group}}</td> <td>{{match.round}}</td> <td class=\"text-center\">{{match.datetime | date : 'dd/MM H:mm'}}</td> <td class=\"text-center\">{{match.home.longName}} x {{match.away.longName}}</td> <td class=\"text-center\"> <div ng-hide=\"matches.table.editResult == match.$id\" ng-click=\"matches.table.editResult = match.$id\"> <span ng-show=\"match.result.home\">{{match.result.home}}x{{match.result.away}}</span> <span class=\"glyphicon glyphicon-pencil\"></span> </div> <form ng-if=\"matches.table.editResult == match.$id\" name=\"resultForm\" class=\"form-inline\" ng-submit=\"matches.updateResult(match, matches.table.result[match.$id])\"> <div class=\"form-group\"> <input autofocus eb-focus=\"matches.table.editResult === match.$id\" size=\"3\" type=\"text\" class=\"form-control\" ng-model=\"matches.table.result[match.$id]\"> <a href ng-click=\"matches.table.editResult = false\">Cancelar</a> </div> </form> </td> </tr> </table> </div> <div class=\"col-xs-12\" ng-hide=\"matches.uploadForm\"> <a href ng-click=\"matches.uploadForm = true\"><span class=\"glyphicon glyphicon-plus\"></span> Importar partidas...</a> </div> </div> </div>");

  $templateCache.put('views/navigation.html', "<div class=\"header\"> <div class=\"navbar navbar-default\" role=\"navigation\"> <div class=\"container\"> <div class=\"navbar-header\"> <button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\"#js-navbar-collapse\"> <span class=\"sr-only\">Toggle navigation</span> <span class=\"icon-bar\"></span> <span class=\"icon-bar\"></span> <span class=\"icon-bar\"></span> </button> <a class=\"navbar-brand\" ui-sref=\"app.dashboard\">Bolão da Raça</a> </div> <div class=\"collapse navbar-collapse\" id=\"js-navbar-collapse\"> <ul class=\"nav navbar-nav\"> <li ng-class=\"{'active': navigation.state.is('app.dashboard')}\"><a ui-sref=\"app.dashboard\"><span class=\"glyphicon glyphicon-home\"></span> Home</a></li> <li ng-class=\"{'active': navigation.state.is('app.myBets')}\"><a ui-sref=\"app.myBets\"><span class=\"glyphicon glyphicon-check\"></span> Meus Palpites</a></li> <li ng-class=\"{'active': navigation.state.is('app.rules')}\"><a ui-sref=\"app.rules\"><span class=\"glyphicon glyphicon-info-sign\"></span> Regras</a></li> <li ng-show=\"navigation.user.admin\" ng-class=\"{'active': navigation.state.includes('app.admin')}\"><a ui-sref=\"app.admin.matches\"><span class=\"glyphicon glyphicon-wrench\"></span> Admin</a></li> </ul> <div class=\"navbar-right\"> <ul class=\"nav navbar-nav\"> <li ng-class=\"{'active': navigation.state.includes('app.profile')}\"> <a ui-sref=\"app.profile\"> <span class=\"glyphicon glyphicon-user\"></span>&nbsp Perfil ({{navigation.user.name}}) </a> </li> </ul> <form class=\"navbar-form navbar-right\"> <button class=\"btn btn-danger\" ng-click=\"navigation.userService.logout()\">Sair <span class=\"glyphicon glyphicon-log-out\"></span></button> </form> </div> </div> </div> </div> </div>");

  $templateCache.put('views/participants.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12\"> <h4>Jogadores registrados <small>Total {{participants.players.length}}</small></h4> <form> <div class=\"form-group\"> <input type=\"text\" class=\"form-control\" placeholder=\"Pesquisar...\" ng-model=\"participants.listFilter\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> </form> <a class=\"pull-right\" href ng-click=\"participants.onlyEmail = true\" ng-hide=\"participants.onlyEmail\">Apenas e-mails</a> <ul class=\"nav nav-tabs\"> <li role=\"presentation\" ng-class=\"{'active': participants.leagueFilter === league}\" ng-repeat=\"league in participants.leagues\"><a href ng-click=\"participants.leagueFilter = league\">{{league}} <span class=\"badge\" ng-show=\"participants.leagueFilter === league\">{{result.length}}</span></a></li> </ul> <div ng-show=\"participants.onlyEmail\"> <div ng-repeat=\"user in participants.players | orderBy: participants.orderBy : participants.reverse | filter: participants.listFilter | league: participants.leagueFilter as result\">{{user.email}},</div> <a href ng-click=\"participants.onlyEmail = false\">Voltar</a> </div> <table class=\"table table-hover table-striped table-bordered table-responsive\" ng-hide=\"participants.onlyEmail\"> <thead> <th ng-click=\"participants.orderBy = 'name' ; participants.reverse = !participants.reverse\">Nome <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"participants.orderBy === 'name' && !participants.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"participants.orderBy === 'name' && participants.reverse\"></span> </th> <th class=\"text-center\">User ID</th> <th ng-click=\"participants.orderBy = 'email' ; participants.reverse = !participants.reverse\">Email <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"participants.orderBy === 'email' && !participants.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"participants.orderBy === 'email' && participants.reverse\"></span> </th> <th class=\"text-center\" ng-click=\"participants.orderBy = 'company' ; participants.reverse = !participants.reverse\">Empresa <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"participants.orderBy === 'company' && !participants.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"participants.orderBy === 'company' && participants.reverse\"></span> </th> <th class=\"text-center\" ng-click=\"participants.orderBy = 'lastLogin' ; participants.reverse = !participants.reverse\">Último login <span class=\"glyphicon glyphicon-triangle-top\" ng-show=\"participants.orderBy === 'lastLogin' && !participants.reverse\"></span> <span class=\"glyphicon glyphicon-triangle-bottom\" ng-show=\"participants.orderBy === 'lastLogin' && participants.reverse\"></span> </th> <!-- <th class=\"text-center\">Campeão</th>\n" + "\t\t\t\t\t<th class=\"text-center\">Goleiro</th> --> <th class=\"text-center\">Admin</th> <th class=\"text-center\">Pontos Extra</th> </thead> <tbody> <tr ng-repeat=\"user in participants.players | orderBy: participants.orderBy : participants.reverse | filter: participants.listFilter | league: participants.leagueFilter\" ng-class=\"{'table-success': user.admin == true}\"> <td nowrap>{{user.name}}</td> <td class=\"text-center\" nowrap>{{user.uid}}</td> <td><span uib-tooltip=\"{{user.uid}}\">{{user.email}}</span></td> <td class=\"text-center\" nowrap>{{user.company}}</td> <td class=\"text-center\" nowrap>{{user.lastLogin | date: 'dd/MM H:mm'}}</td> <!-- <td class=\"text-center\">\n" + "\t\t\t\t\t\t\t{{user.bets.winner.longName}}\n" + "\t\t\t\t\t\t\t<span ng-hide=\"user.bets.topScorer && user.bets.winner\"><span class=\"glyphicon glyphicon-remove text-danger\"></span></span>\n" + "\t\t\t\t\t\t</td>\n" + "\t\t\t\t\t\t<td class=\"text-center\">\n" + "\t\t\t\t\t\t\t{{user.bets.topScorer}}\n" + "\t\t\t\t\t\t\t<span ng-hide=\"user.bets.topScorer && user.bets.winner\"><span class=\"glyphicon glyphicon-remove text-danger\"></span></span>\n" + "\t\t\t\t\t\t</td> --> <td class=\"text-center\" nowrap> <a ng-hide=\"user.admin\" ng-click=\"participants.makeUserAdmin(user)\"><span class=\"glyphicon glyphicon-ok\"></span></a> <a ng-hide=\"!user.admin\" ng-click=\"participants.makeUserSimple(user)\"><span class=\"glyphicon glyphicon-remove\"></span></a> </td> <td class=\"text-left\" nowrap> <span class=\"label label-success\" ng-show=\"user.extraPoints\">{{user.extraPoints}}</span> <span ng-hide=\"user.extraPoints\">0</span> <span class=\"pull-right\"> <a href ng-click=\"participants.addExtraPoints(user,1)\" ng-hide=\"user.extraPoints === 6\"><span class=\"glyphicon glyphicon-plus-sign\"></span></a> <a href ng-click=\"participants.addExtraPoints(user,-1)\" ng-show=\"user.extraPoints\"><span class=\"glyphicon glyphicon-minus-sign\"></span></a> </span> </td> </tr> </tbody> </table> <hr> </div> <div class=\"col-xs-4\"> <h4>Aguardando cadastro <small>Total {{participants.pending.length}}</small></h4> <div ng-hide=\"participants.pending.length\"> <span><em>Ninguém na lista de espera.</em></span> </div> <div ng-repeat=\"item in participants.pending | league: participants.leagueFilter\"> <span>{{item.email}} ({{item.league}})</span> <a href ng-click=\"participants.deletePending(item)\">Cancelar</a> </div> </div> <div class=\"col-xs-4\"> <div> <h4>Adicionar novos e-mails</h4> <a href ng-hide=\"participants.showAddEmails\" ng-click=\"participants.showAddEmails = true\"><span class=\"glyphicon glyphicon-plus\"></span> Adicionar e-mails</a> </div> <form ng-show=\"participants.showAddEmails\"> <div class=\"form-group\"> <textarea class=\"form-control\" name=\"newEmails\" cols=\"30\" rows=\"10\" placeholder=\"email@email.com, email@email.com, ...\" ng-model=\"participants.form.newEmails\"></textarea> </div> <p class=\"help-block\">E-mails separados por vírgula.</p> <div class=\"form-group\"> <label>Qual campeonato?</label> <select class=\"form-control\" ng-options=\"league for league in participants.leagues\" ng-model=\"participants.form.league\">{{league}} <option value=\"\" disabled selected hidden>Selecione</option> </select> </div> <button class=\"btn btn-primary\" ng-click=\"participants.addNewEmails(participants.form.newEmails, participants.form.league)\">Adicionar</button> <button class=\"btn btn-default\" ng-click=\"participants.form.newEmails = undefined; participants.showAddEmails = false\">Cancelar</button> </form> </div> <div class=\"col-xs-4\"> <div> <h4>Adicionar participantes</h4> <a href ng-hide=\"participants.showAddParticipant\" ng-click=\"participants.showAddParticipant = true\"><span class=\"glyphicon glyphicon-plus\"></span> Adicionar e-mails</a> </div> <form ng-show=\"participants.showAddParticipant\"> <div class=\"form-group\"> <label>User ID</label> <input class=\"form-control\" name=\"uid\" placeholder=\"User ID\" ng-model=\"participants.form.uid\"> </div> <div class=\"form-group\"> <label>E-mail</label> <input class=\"form-control\" name=\"email\" placeholder=\"email@email.com\" ng-model=\"participants.form.email\"> </div> <div class=\"form-group\"> <label>Nome</label> <input class=\"form-control\" name=\"name\" placeholder=\"Nome\" ng-model=\"participants.form.name\"> </div> <div class=\"form-group\"> <label>Qual campeonato?</label> <select class=\"form-control\" ng-options=\"league for league in participants.leagues\" ng-model=\"participants.form.league\">{{league}} <option value=\"\" disabled selected hidden>Selecione</option> </select> </div> <button class=\"btn btn-primary\" ng-click=\"participants.addNewParticipant(participants.form.uid, participants.form.email, participants.form.name, participants.form.league)\">Adicionar</button> <button class=\"btn btn-default\" ng-click=\"participants.form.uid = undefined; participants.form.email = undefined; participants.form.name = undefined; participants.showAddParticipant = false\">Cancelar</button> </form> </div> </div> </div>");

  $templateCache.put('views/password_modal.html', "<div class=\"row\"> <div class=\"col-xs-12\"> <div class=\"modal-header\"> <h3 class=\"modal-title\">Adj meg egy új jelszót!</h3> </div> <div class=\"modal-body\"> <form name=\"passForm\"> <div class=\"form-group\" ng-class=\"{'has-success': passForm.tempPassword.$dirty && passForm.tempPassword.$touched}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"tempPassword\" ng-model=\"form.tempPassword\" placeholder=\"Ideiglenes jelszó\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> <div ng-messages=\"passForm.tempPassword.$error\" ng-if=\"passForm.tempPassword.$touched\"> <p class=\"help-block\" ng-message=\"required\">Kötelező megadni</p> </div> </div> <div class=\"form-group\" ng-class=\"{'has-error': passForm.password.$touched && passForm.password.$invalid,'has-success': passForm.password.$dirty && passForm.password.$touched}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required minlength=\"6\" type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"password\" ng-model=\"form.password\" placeholder=\"Új jelszó\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> <div ng-messages=\"passForm.password.$error\" ng-if=\"passForm.password.$touched\"> <p class=\"help-block\" ng-message=\"required\">Kötelező jelszót megadni</p> <p class=\"help-block\" ng-message=\"minlength\">Legalább 6 karakter hosszú jelszót adj meg</p> </div> </div> <!-- Password check --> <div class=\"form-group\" ng-class=\"{'has-error': form.password !== form.passwordCheck && passForm.passwordCheck.$touched, 'has-success': form.password === form.passwordCheck && passForm.passwordCheck.$dirty}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"passwordCheck\" ng-model=\"form.passwordCheck\" placeholder=\"Új jelszó megerősítése\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\" ng-disabled=\"passForm.password.$invalid\"> </div> <div class=\"help-block\" ng-show=\"form.password !== form.passwordCheck && passForm.passwordCheck.$touched\">Nem egyezik a két jelszó</div> </div> </form> </div> <div class=\"modal-footer\"> <button class=\"btn btn-primary\" ng-disabled=\"resetForm.$invalid\" ng-click=\"password.changePassword(form)\">Rendben</button> </div> </div> </div>");

  $templateCache.put('views/profile.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-sm-12 col-md-12 col-xl-8\"> <h3>Perfil</h3> <hr> <h5> <span class=\"glyphicon glyphicon-envelope text-info\"></span> <strong>E-mail</strong> </h5> <span>{{profile.user.email}}</span> <small class=\"help-block\"><span class=\"glyphicon glyphicon-lock\"></span> Você não pode mudar seu endereço de email.</small> <hr> <h5> <span class=\"glyphicon glyphicon-user text-info\"></span> <strong>Nome</strong> </h5> <span ng-hide=\"profile.form.name\">{{profile.user.name}} <small> <a href ng-click=\"profile.editParam('name')\">(Alterar)</a> </small> </span> <form class=\"form-horizontal\" ng-submit=\"profile.saveParam('name',profile.form.name)\" ng-show=\"profile.form.name\"> <div class=\"form-group\"> <div class=\"col-xs-8 col-sm-6 col-lg-3\"> <input type=\"text\" class=\"form-control\" ng-model=\"profile.form.name\" ng-blur=\"profile.saveParam('name',profile.form.name)\"> </div> <button type=\"submit\" class=\"btn btn-primary\">Salvar</button> </div> </form> <hr> <h5> <span class=\"glyphicon glyphicon-briefcase text-info\"></span> <strong>Empresa </strong> </h5> <span ng-hide=\"profile.form.company\">{{profile.user.company}} <small> <a href ng-click=\"profile.editParam('company')\">(Alterar)</a> </small> </span> <form class=\"form-horizontal\" ng-submit=\"profile.saveParam('company',profile.form.company)\" ng-show=\"profile.form.company\"> <div class=\"form-group\"> <div class=\"col-xs-8 col-sm-6 col-lg-3\"> <input type=\"text\" class=\"form-control\" ng-model=\"profile.form.company\" ng-blur=\"profile.saveParam('company',profile.form.company)\"> </div> <button type=\"submit\" class=\"btn btn-primary\">Salvar</button> </div> </form> <hr> </div> <div class=\"col-xs-12 col-sm-6 col-xl-6\"> <h4>Alterar senha</h4> <a href ng-click=\"profile.showPasswordChange = true\" ng-hide=\"profile.showPasswordChange\">Quero alterar a minha senha</a> <form name=\"passForm\" ng-if=\"profile.showPasswordChange\" class=\"col-xs-12\"> <div class=\"form-group\" ng-class=\"{'has-error': passForm.oldPassword.$touched && passForm.oldPassword.$invalid, 'has-success': passForm.oldPassword.$dirty && passForm.oldPassword.$touched}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"oldPassword\" ng-model=\"form.oldPassword\" placeholder=\"Senha atual\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> <div ng-messages=\"passForm.oldPassword.$error\" ng-if=\"passForm.oldPassword.$touched\"> <p class=\"help-block\" ng-message=\"required\">Campo Obrigatório</p> </div> </div> <div class=\"form-group\" ng-class=\"{'has-error': passForm.password.$touched && passForm.password.$invalid,'has-success': passForm.password.$dirty && passForm.password.$touched}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required minlength=\"6\" type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"password\" ng-model=\"form.password\" placeholder=\"Nova senha\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> <div ng-messages=\"passForm.password.$error\" ng-if=\"passForm.password.$touched\"> <p class=\"help-block\" ng-message=\"required\">Senha requerida</p> <p class=\"help-block\" ng-message=\"minlength\">A senha deve ter pelo menos 6 caracteres</p> </div> </div> <!-- Password check --> <div class=\"form-group\" ng-class=\"{'has-error': form.password !== form.passwordCheck && passForm.passwordCheck.$touched, 'has-success': form.password === form.passwordCheck && passForm.passwordCheck.$dirty}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"passwordCheck\" ng-model=\"form.passwordCheck\" placeholder=\"Confirme a nova senha\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\" ng-disabled=\"passForm.password.$invalid\"> </div> <div class=\"help-block\" ng-show=\"form.password !== form.passwordCheck && passForm.passwordCheck.$touched\">As senhas informadas são diferentes</div> </div> <button class=\"btn btn-primary\" ng-click=\"profile.changePassword(form)\">Salvar</button> <button class=\"btn btn-default\" ng-click=\"profile.showPasswordChange=false; profile.reset(passForm)\">Cancelar</button> </form> </div> <!-- <div class=\"col-xs-12\" ng-hide=\"profile.showPassword\">\n" + "\t\t\t<hr>\n" + "\t\t\t<button class=\"btn btn-danger\" ng-click=\"profile.showPassword = true\">Excluir perfil</button>\n" + "\t\t\t<span class=\"text-danger\"><strong>&nbsp ATENÇÃO! </strong> Isto irá eliminá-lo do jogo. Todos os seus palpites e sua pontuação serão perdidos.</span>\n" + "\t\t</div> --> <form class=\"col-md-6 cl-lg-3\" ng-show=\"profile.showPassword\" name=\"passwordForm\"> <hr> <div class=\"form-group\"> <label>Senha</label> <input type=\"password\" class=\"form-control\" ng-model=\"profile.form.password\" eb-focus=\"profile.showPassword\" required> </div> <button class=\"btn btn-danger\" ng-click=\"profile.deleteProfile(profile.form.password)\" ng-disabled=\"passwordForm.$invalid\">Desejo excluir meu perfil</button> </form> </div> </div>");

  $templateCache.put('views/public_profile.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12\"> <h1>{{public.user.name}} <small>{{public.user.company}}</small></h1> <h4 ng-hide=\"public.now < public.start || !public.user.bets.winner || !public.user.bets.topScorer\"><span class=\"flag-icon\" ng-class=\"{'flag-icon-{{public.user.bets.winner.ISO}}': true}\"></span> {{public.user.bets.winner.longName}} | <span class=\"glyphicon glyphicon-star-empty\"></span> {{public.user.bets.topScorer}}</h4> <!-- <h4 ng-hide=\"public.user.bets.winner || public.user.bets.topScorer\"><small>Nenhum favorito informado</small></h4> --> </div> </div> <br> <div class=\"row\"> <div class=\"col-xs-12 col-md-8\"> <h2>Extrato dos Palpites <span class=\"label label-success pull-right\">{{public.user.score}} pontos</span></h2> <hr> <h4 ng-repeat=\"match in public.matches | orderBy: 'datetime' : true | result as result\" class=\"match-entry\"> <span ng-show=\"match.home.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.home.ISO}}': true}\"></span> <img ng-show=\"match.home.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.home.iconImg}}\"> <a ui-sref=\"app.match({matchId: match.$id})\"> <span class=\"hidden-xs\">{{match.home.longName}} x {{match.away.longName}}</span> <span class=\"visible-xs-inline\">{{match.home.shortName}} x {{match.away.shortName}}</span> </a> <img ng-show=\"match.away.iconImg!=''\" class=\"teamIcon25\" ng-src=\"images/teams/{{match.away.iconImg}}\"> <span ng-show=\"match.away.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{match.away.ISO}}': true}\"></span> <span class=\"label label-success pull-right\" ng-show=\"public.user.bets.matches[match.$id].points\"><span class=\"glyphicon glyphicon-ok\"></span> {{public.user.bets.matches[match.$id].points}} pontos</span> <span class=\"label label-default pull-right\" ng-hide=\"public.user.bets.matches[match.$id].points || !match.result\"><span class=\"glyphicon glyphicon-remove\"></span> 0 pontos</span> <span ng-show=\"!match.result\" class=\"pull-right\"><small>Resultado não cadastrado.</small></span> <small> <div><b>{{match.result.home}}x{{match.result.away}}</b> (Palpite: {{public.user.bets.matches[match.$id].home}}x{{public.user.bets.matches[match.$id].away}})</div> </small> </h4> <h4><small ng-hide=\"result.length\">Pontos marcados nos jogos serão mostrados aqui.</small></h4> </div> </div> </div>");

  $templateCache.put('views/ranking.html', "<div class=\"container\"> <div class=\"row\"> <form class=\"form-inline\"> <label for=\"filter\">Filtrar por Rodada</label> <select id=\"filter\" ng-model=\"filter\" class=\"form-control\"> <option selected>Todas</option> <option>Rodada 1</option> <option>Rodada 2</option> <option>Rodada 3</option> <option>Oitavas de Final</option> <option>Quartas-Semi-Finais</option> </select> <button class=\"btn btn-success\" ng-click=\"ranking.filterRanking(filter)\">Filtrar</button> </form> </div> <hr> <div class=\"row\"> <div class=\"col-xs-12 col-md-12\"> <table class=\"table table-sm table-striped table-dark table-responsive\"> <thead> <tr> <th scope=\"col\" class=\"text-center\" colspan=\"4\">RANKING</th> </tr> <tr> <th scope=\"col\">#</th> <th scope=\"col\">Nome</th> <th scope=\"col\">Palpites (16/rodada)</th> <th scope=\"col\">Pontuação</th> </tr> </thead> <tbody> <tr ng-repeat=\"player in ranking.players | orderBy: ['totalScore', '-name'] : true | league: ranking.leagueFilter track by player.uid\"> <th scope=\"row\">{{$index +1}}</th> <td>{{player.name}}</td> <td>{{ranking.getObjSize(player.bets.matches)}} <small>(Ver)</small></td> <!-- <td>{{ranking.filterScore(player, filter)}}</td> --> <td>{{player.totalScore}}</td> </tr> </tbody> </table> </div> </div> </div>");

  $templateCache.put('views/register.html', "<div class=\"container\"> <div class=\"row\"> <img src=\"images/b12.jpg\" class=\"img-responsive\"> </div> <div class=\"row\"> <div class=\"col-xs-12 col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3\"> <div class=\"alert alert-danger text-center\" ng-show=\"register.errorMessage\">{{register.errorMessage}}</div> <form name=\"regForm\" class=\"form\" ng-submit=\"register.registerUser(form.email, form.password)\" novalidate autocomplete=\"false\"> <center><h4>Cadastro no Bolão</h4></center> <p class=\"text-warning\">Você só poderá se cadastrar com o endereço de e-mail que os organizadores autorizaram. <br>Se você não tem certeza qual o email autorizado, entre em contato com os organizadores (Renan ou Betão)!</p> <!-- Email --> <div class=\"form-group\" ng-class=\"{ 'has-error': regForm.email.$touched && regForm.email.$invalid, 'has-success': regForm.email.$touched && regForm.email.$valid }\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-envelope\"></span></div> <input required type=\"email\" class=\"form-control\" id=\"emailInput\" name=\"email\" ng-model=\"form.email\" placeholder=\"Email\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> <div ng-messages=\"regForm.email.$error\" ng-if=\"regForm.email.$touched\"> <p class=\"help-block\" ng-message=\"required\">E-mail obrigatório</p> <p class=\"help-block\" ng-message=\"email\">Digite o e-mail completo</p> </div> </div> <!-- Password --> <div class=\"form-group\" ng-class=\"{'has-error': regForm.password.$touched && regForm.password.$invalid,'has-success': regForm.password.$dirty && regForm.password.$touched}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required minlength=\"6\" type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"password\" ng-model=\"form.password\" placeholder=\"Senha\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> </div> <div ng-messages=\"regForm.password.$error\" ng-if=\"regForm.password.$touched\"> <p class=\"help-block\" ng-message=\"required\">Senha obrigatória</p> <p class=\"help-block\" ng-message=\"minlength\">A senha deve ter no mínimo 6 caracteres</p> </div> </div> <!-- Password check --> <div class=\"form-group\" ng-class=\"{'has-error': form.password !== form.passwordCheck && regForm.passwordCheck.$touched, 'has-success': form.password === form.passwordCheck && regForm.passwordCheck.$dirty}\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-lock\"></span></div> <input required type=\"password\" class=\"form-control\" id=\"passwordInput\" name=\"passwordCheck\" ng-model=\"form.passwordCheck\" placeholder=\"Confirme a senha\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\" ng-disabled=\"regForm.password.$invalid\"> </div> <div class=\"help-block\" ng-show=\"form.password !== form.passwordCheck && regForm.passwordCheck.$touched\">As senhas são diferentes</div> </div> <!-- Submit button --> <div class=\"form-group\"> <button type=\"submit\" class=\"btn btn-info btn-block\" ng-disabled=\"regForm.$invalid || form.password !== form.passwordCheck || register.loading\"> <span ng-hide=\"register.loading\">Cadastrar</span> <span ng-show=\"register.loading\">Cancelar...</span> </button> <hr> <div class=\"col-xs-12\"> <p class=\"text-center\">Já tem cadastro? <a ui-sref=\"login\">Clique aqui para efetuar o login.</a></p> </div> </div> </form> </div> </div> </div>");

  $templateCache.put('views/reset.html', "<div class=\"container\"> <div class=\"row\"> <img src=\"images/b12.jpg\" class=\"img-responsive\"> </div> <div class=\"row\"> <div class=\"col-xs-12 col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3\"> <form name=\"resetForm\"> <center><h4>Esqueci minha senha</h4></center> <div class=\"form-group\"> <div class=\"input-group\"> <div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-envelope\"></span></div> <input type=\"email\" class=\"form-control\" placeholder=\"Digite seu e-mail\" ng-model=\"reset.form.email\" required> </div> </div> <button class=\"btn btn-primary btn-block\" ng-click=\"reset.resetPassword(reset.form.email)\" ng-disabled=\"resetForm.$invalid\">Receber nova senha</button> <br> <p class=\"text-center\"><a ui-sref=\"login\">Não, eu sei minha senha!</a></p> </form> </div> </div> </div>");

  $templateCache.put('views/rule_modal.html', "<div class=\"row\"> <div class=\"col-xs-12\"> <div class=\"modal-header\"> <h2 class=\"modal-title\">Regras do Bolão da Raça</h2> </div> <div class=\"modal-body\"> <h4>Sistema de nocaute</h4> <ul> <li>As partidas serão adicionadas ao sistema após as partidas do grupo e após as rodadas eliminatórias. A adivinhação é normal (5 minutos antes do jogo).</li> <li>As dicas referem-se ao tempo de reprodução normal, ou seja, 90 minutos e 120 minutos para uma extensão.</li> <li>O 11º duelo não conta para marcar, então se alguém tiver uma dica de empate, ele acha que 11 partidas serão disputadas. Se, por exemplo, 90 minutos após 1-1, mas na prorrogação um gol é marcado, então 2-1 é a ponta direita.</li> </ul> <h4>Calor de matar (mata mata?)</h4> <ul> <li>Duas das mesmas pontuações serão encaminhadas, cuja equipe final ganha mais no EB.</li> <li>Se esta é a mesma equipe / ele fez o mesmo, o goleiro que marca mais gols conta</li> <li>Se esse for o caso, o hit de dois pontos será contado</li> </ul> <a ui-sref=\"app.rules\" ng-click=\"ruleModal.closeAlert()\">Regulamento do Bolão</a> </div> <div class=\"modal-footer\"> <button class=\"btn btn-primary\" ng-click=\"ruleModal.turnOffAlert(ruleModal.user)\">Ok!</button> </div> </div> </div>");

  $templateCache.put('views/rules.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12 col-md-8 col-md-offset-2\"> <h3>Regras Bolão da Raça <br> <small>Campeonato Brasileiro Série B 2018.</small></h3> <hr> <h4><a name=\"pontok\"></a>1. Da entrada no Bolão</h4> <ul> <li>somente será incluído/mantido no grupo do bolão quem estiver “às vera”, ou seja, depositado o valor de R$ 100,00 nas contas a seguir indicadas, sendo que o palpiteiro *deve enviar o comprovante de TED/Depósito NO PRIVADO para Betão (48) 99176-1767;</li> </ul> <h4><a name=\"pontok\"></a>2. Da Administração</h4> <ul> <li>O “Bolão da Raça Brasileiro Série B - 2º Turno” será administrado exclusivamente pelo Betão e Renan - não será cobrado nenhum tipo de taxa de administração, apenas a isenção do valor da inscrição para o administrador do sistema (Renan), 100% do dia valor arrecadado será revertido (distribuído) entre os melhores palpiteiros, conforme premiação abaixo. Casos omissos a regra serão decididos conjuntamente entre os administradores e terá força de lei.</li> </ul> <h4><a name=\"pontok\"></a>3. Das pontuações</h4> <ul> <li>Placar cravado: <b>7 pontos</b></li> <li>Acertou resultado e a diferença de gols: <b>5 (com exceção ao empate)</b></li> <li>Acertou resultado empate (não cravando): <b>4 pontos</b></li> <li>Acertou somente o resultado: <b>3 (com exceção do empate)</b></li> <li>Acertou apenas número de gols de uma das equipes: <b>1 ponto</b></li> * não acumulativo os pontos no mesmo jogo! <br><br> <li><b>3.1.</b> Em havendo empate em número de pontos (ao final da fase ou do bolão) o critério de desempate será pelo maior número de placares CRAVADO que tenha acertado o Palpiteiro(a), permanecendo o empate o valor será dividido igualmente entre os palpiteiros(as),</li> </ul> <h4><a name=\"pontok\"></a>4. Do envio dos palpites</h4> <ul> <li>Após confirmado o depósito será enviado ao palpiteiro um link ao site oficial do Bolão, onde com seu e-mail e senha realizará seus palpites da rodada, podendo inserir e/ou alterar até 30 minutos antes do início da partida. </li> <br> <li><b>4.1.</b>Caso haja alguma inconsistência no sistema devido a problemas técnicos o palpiteiro deverá enviar seus palpites (digitado, foto ou print da tela) por WhatsApp (✔✔), DIRETAMENTE, para o número oficial do Bolão - (48) 98475-2233, até 30 minantes do início de cada jogo;</li> <li><b>4.2.</b>Em caso de envio do palpite seja realizado pelo aplicativo WhatsApp <b>não será admitido substituição de palpite</b>, ou seja, palpite envido e recebido (dentro do prazo) será registrado, o palpite recebido em duplicidade será desconsiderado;</li> </ul> <h4><a name=\"pontok\"></a>5. Dos jogos selecionados e rodadas:</h4> <ul> <li>A cada rodada serão selecionados 5 jogos, obrigatoriamente os jogos envolvendo os clubes catarinenses (Avaí, Figueirense e Criciúma), e outros a livre escolha da administração até completar 5 jogos por rodada.</li> <br> <li><b>5.1.</b> A cada 5 rodadas vamos ter o início de uma fase, e consequentemente uma premiação para o melhor palpiteiro de cada fase, assim divididos:</li> <li><b>Fase 1</b>: 20ª rodada à 24ª rodada - 25 jogos;</li> <li><b>Fase 2</b>: 25ª rodada à 29ª rodada - 25 jogos;</li> <li><b>Fase 3</b>: 30ª rodada à 34ª rodada - 25 jogos;</li> <li><b>Fase 4</b>: 35ª rodada à 38ª rodada - 20 jogos.</li> * Fase 4 excepcionalmente terá 4 rodadas, por conta da quantidade de jogos do turno (19) </ul> <h4><a name=\"pontok\"></a>6. Da premiação</h4> <ul> <li>Os prêmios em dinheiro serão repassado aos felizardos palpiteiros(as), advindo da receita arrecadada por todos partícipes do bolão na forma proporcional a seguir descrita:</li> <br> <li><b>1º Lugar Geral:</b> 40% (quarenta por cento) do total arrecadado;</li> <li><b>2º Lugar Geral:</b> 25% (vinte e cinco por cento) do total arrecadado;</li> <li><b>3º Lugar Geral:</b> 10% (dez por cento) do total arrecadado;</li> <br> <li><b>6.1.</b> Ao término de cada rodada o melhor desempenho receberá uma premiação de 5% (cinco por cento) do total arrecadado;</li> </ul> <h4><a name=\"pontok\"></a>7. Pagamento do Bolão</h4> <ul> <li>*Pode ser realizado pessoalmente e apenas em dinheiro, para qualquer um dos administradores ou através de TED/Depósito em qualquer das contas a seguir listadas:</li> </ul> <b>Dados Bancários:</b><br> <br> Titular: <b>Norberto Becker Neto</b><br> CPF/MF: <b>867.205.899-20</b><br> <br> 🇮🇲 Banco Bradesco 🇮🇲( <b>237</b> )<br> Agência <b>0348-4</b><br> Conta Corrente <b>2202-0</b><br> <br> 🇻🇨 Banco SICOOB 🇻🇨 ( <b>756</b> )<br> Agência <b>3326-0</b><br> Conta Corrente <b>27309-0</b><br> <br> 🇪🇺 Banco Caixa Econômica Federal 🇪🇺 ( <b>104</b> )<br> Agência <b>1875</b><br> Operação <b>013</b><br> Conta Poupança <b>21346-5</b><br> <br> 🇧🇷 Banco do Brasil 🇧🇷 ( <b>001</b> )<br> Agência <b>5251-5</b><br> Variação <b>51</b><br> Conta Poupança <b>12739-6</b><br> <h4><a name=\"pontok\"></a>8. Premiação</h4> <ul> <li>Será paga (repassada aos felizardos palpiteiros) até o primeiro dia útil após o término da última rodada e definição dos “rabudos(as).</li> </ul> <h4><a name=\"pontok\"></a>9. Sugestões e colaborações para o bolão</h4> <ul> <li>Serão sempre bem vindas, e em estando em consentâneo como lóbi de nossa guilda, compreenderão o arcabouço das Regras do Bolão da Raça. 🤗</li> </ul> <hr> <!-- \n" + "\t\t\t<h5><a name=\"joginyilatkozat\"></a>Jogi nyilatkozat</h5>\n" + "\t\t\t<small>\n" + "\t\t\t\t<p>A Tippjáték szervezői: Cinkotai Norbert (<a href=\"mailto:norbert.cinkotai@kbcsecurities.hu\">norbert.cinkotai@kbcsecurities.hu</a>) és Somi András (<a href=\"mailto:andras.somi@kbcsecurities.hu\">andras.somi@kbcsecurities.hu</a>).</p>\n" + "\n" + "\t\t\t\t<p>A Tippjátékban való részvétel teljesen önkéntes és ingyenes, ezen felül előzetes regisztrációhoz kötött. A regisztráció feltétele egy valós e-mail cím elküldése a norbert.cinkotai@kbcsecurities.hu e-mail címre, valamint az így kapott regisztrációs link aktiválása, mellyel a résztvevők automatikusan elfogadják és magukra nézve kötelezőnek tekintik a jelen Szabályzatban foglaltakat is. A Tippjáték szervezői fenntartják a jogot, hogy a nyilvánvalóan visszaélésszerű, rosszhiszemű, „troll” regisztrációs igényeket elutasítsák.</p>\n" + "\n" + "\t\t\t\t<p>A résztvevők tudomásul veszik, hogy: a) a regisztráció során vagy azt követően megadott felhasználónevüket a Tippjáték szervezői jogosultak a Tippjáték aktuális állásának ismertetése és a végső eredményhirdetés során közzétenni; b) a Tippjátéknak nincs előre meghatározott nyereménye, a cél elsősorban maga a szórakozás, illetve a foci népszerűsítése, így a győztes(ek)nek járó erkölcsi elismerés  konkrét nyereményre nem váltható át, valamint vagyoni/nem vagyoni igény érvényesítésére sem jogosít; c) maguk a Tippjáték szervezői is jogosultak a játékban részt venni, azonos feltételekkel, mint az egyéb résztvevők, kötelesek azonban mindenkor jóhiszeműen és tisztességesen eljárni.</p>\n" + "\n" + "\t\t\t\t<p>A Tippjátékkal összefüggésben a szervezők mint magánszemélyek járnak el, így e tevékenységük, valamint maga a Tippjáték semmilyen formában nem hozható összefüggésbe munkáltatójukkal, a KBC Securities N.V.-vel, illetve a KBC Securities Magyarországi Fióktelepével. A szervezők tevékenysége továbbá kizárólag a regisztráció elősegítésére, valamint a tippek leadásához szükséges elektronikus felület kialakítására és karbantartására terjed ki, így nem terheli őket felelősség különösen: a) a mérkőzések eredményeinek alakulásáért; b) a mérkőzések bármely okból történő elmaradásáért; c) a magyar válogatott esetleges (nem várt) idő előtti kieséséért; d) a rendező francia válogatott játékvezetők általi esetleges (várt) favorizálásáért.</p>\n" + "\n" + "\t\t\t\t<p>A Tippjátékban történő részvétel érdekében fentiek szerint elküldött felhasználói e-mail címek, valamint önkéntesen megadott esetleges egyéb személyes adatok a játék lezárultát követően haladéktalanul törlésre kerülnek.</p>\n" + "\n" + "\t\t\t\t<p>A szervezők fenntartják a jogot, hogy e Szabályzatot a résztvevők értesítése mellett, egyoldalúan módosítsák.</p>\n" + "\t\t\t</small>\n" + "\t\t\t --> </div> </div> </div>");

  $templateCache.put('views/teamdetails.html', "<div class=\"container\"> <div class=\"row\"> <div class=\"col-xs-12 col-sm-6\"> <a ui-sref=\"app.admin.teamList\">Voltar</a> <h4> <span ng-show=\"team.current.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{team.current.ISO}}': true}\"></span> <img ng-show=\"team.current.iconImg!=''\" ng-src=\"images/teams/{{team.current.iconImg}}\"> {{team.current.longName}} <small>({{team.current.shortName}})</small> </h4> <p class=\"player\" ng-repeat=\"player in team.data.players | team: team.current.$id track by player.$id \">{{player.name}} <a href ng-click=\"team.removePlayer(player)\"><span class=\"glyphicon glyphicon-remove\"></span></a></p> </div> <!-- ADD TEAM FORM --> <div class=\"col-xs-12 col-sm-6\"> <form name=\"playerForm\"> <h4>Adicionar jogadores</h4> <div class=\"form-group\"> <!-- Players --> <div class=\"form-group\"> <textarea required class=\"form-control\" id=\"\" cols=\"30\" rows=\"10\" ng-model=\"team.form.players\" placeholder=\"Lista de jogadores\"></textarea> <div class=\"help-block\">Inserir jogadores separados por vírgula.</div> </div> <button class=\"btn btn-primary\" ng-click=\"team.addPlayers(team.current, team.form.players); team.reset(playerForm)\" ng-disabled=\"playerForm.$invalid\">Cadastrar</button> </div></form> </div> </div> </div>");

  $templateCache.put('views/teams.html', "<div class=\"container\"> <div class=\"row\"> <!-- TEAM LIST --> <div class=\"col-md-6\" ng-hide=\"teams.uploadForm\"> <ul class=\"list-group\"> <li class=\"list-group-item\" ng-repeat=\"team in teams.data.teams | orderBy: 'shortName'\"> <span ng-show=\"team.ISO!=''\" class=\"flag-icon\" ng-class=\"{'flag-icon-{{team.ISO}}': true\"></span> <img ng-show=\"team.iconImg!=''\" class=\"teamIcon20\" ng-src=\"images/teams/{{team.iconImg}}\"> {{team.longName}} ({{team.shortName}}) <span class=\"list-edit-controls pull-right text-danger\"> <a href ui-sref=\"app.admin.teamDetails({team: team.shortName})\" title=\"Jogadores\"><span class=\"glyphicon glyphicon-user\"></span>&nbspJogadores</a> </span> </li> </ul> </div> </div> <div class=\"row\"> <div class=\"col-xs-12\" ng-show=\"teams.uploadForm\"> <h4>Importar equipes</h4> <form name=\"teamsForm\" ng-submit=\"teams.upload(teams.form.list, teamsForm)\"> <div class=\"form-group\"> <label>Lista de Equipes</label> <textarea required class=\"form-control\" name=\"teamList\" id=\"teamList\" cols=\"30\" rows=\"10\" placeholder=\"Formato: Nome; Apelido; Código ISO (css); Escudo (Imagem)\" ng-model=\"teams.form.list\"></textarea> </div> <p class=\"help-block\" ng-show=\"teamsForm.teamList.$touched && teamsForm.teamList.$invalid\">Copie as informações da equipe!</p> <button class=\"btn btn-primary\" type=\"submit\" ng-disabled=\"teamsForm.$invalid\">Importar</button> <button class=\"btn btn-default\" type=\"reset\" ng-click=\"teams.uploadForm=false; teams.reset(teamsForm)\">Cancelar</button> </form> </div> <div class=\"col-xs-12\" ng-hide=\"teams.uploadForm || teams.disableUpload\"> <a href ng-click=\"teams.uploadForm = true\"> <span class=\"glyphicon glyphicon-plus\"></span> Importar equipes</a> </div> </div> </div>");

  $templateCache.put('views/welcome_modal.html', "<div class=\"row\"> <div class=\"col-xs-12\"> <div class=\"modal-header\"> <h2 class=\"modal-title\">Üdv a 2016-os Eb tippjátékban!</h2> </div> <div class=\"modal-body\"> <h4>Szabályok</h4> <ul> <li>Minden meccs előtt tippelni kell a végeredményre.</li> <li>Aki eltalálja a győztest (vagy a döntetlent) az kap <strong>1 pontot</strong></li> <li>Ha a pontos eredmény is egyezik, akkor jár <strong>+ 1 pont</strong>.</li> <li>Az első meccs előtt tippelni kell a végső győztesre, és a gólkirályra is, ezek eltalálása <strong>3-3 pontot jelent</strong> majd.</li> <li>A tippeket a meccsek kezdete előtt lehet leadni, legfeljebb 5 perccel a kezdőrúgás előtt.</li> <li>A tippeket bármennyiszer lehet módosítani eddig az időpontig.</li> </ul> <p>Mielőtt belevetnéd magad a tippelésbe, add meg a nevedet, és ha szeretnéd, a cégedet is.</p> <form name=\"modalForm\" class=\"form\"> <div class=\"form-group\" ng-class=\"{'has-error': modalForm.name.$touched && modalForm.name.$invalid, 'has-success': modalForm.name.$touched && modalForm.name.$valid}\"> <label>Neved:</label> <div class=\"input-group\"> <input type=\"text\" class=\"form-control\" name=\"name\" ng-model=\"modal.form.name\" placeholder=\"pl. Böde Dániel\" required ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> <div class=\"input-group-addon\" ng-if=\"!modalForm.name.$touched\"><span class=\"glyphicon glyphicon-user\"></span></div> <div class=\"input-group-addon\" ng-if=\"modalForm.name.$touched && modalForm.name.$valid\"><span class=\"glyphicon glyphicon-ok\"></span></div> <div class=\"input-group-addon\" ng-if=\"modalForm.name.$touched && modalForm.name.$invalid\"><span class=\"glyphicon glyphicon-alert\"></span></div> </div> <div class=\"help-block\" ng-hide=\"modalForm.name.$invalid && modalForm.name.$touched\">Ezt a nevet minden játékos látni fogja. Bármikor megváltoztathatod.</div> <div ng-messages=\"modalForm.name.$error\" ng-if=\"modalForm.name.$touched\"> <p class=\"help-block\" ng-message=\"required\">Nevet kötelező megadni.</p> </div> </div> <div class=\"form-group\" ng-class=\"{'has-success': modal.form.company}\"> <label>Céged:</label> <div class=\"input-group\"> <input type=\"text\" class=\"form-control\" name=\"company\" ng-model=\"modal.form.company\" placeholder=\"pl. KBC Securities\" ng-model-options=\"{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }\"> <div class=\"input-group-addon\" ng-if=\"modalForm.company.$pristine || !modal.form.company\"><span class=\"glyphicon glyphicon-briefcase\"></span></div> <div class=\"input-group-addon\" ng-if=\"modal.form.company\"><span class=\"glyphicon glyphicon-ok\"></span></div> </div> <div class=\"help-block\">Így össze tudjuk vetni az eredményeket cégek között is. Bármikor megváltoztathatod.</div> </div> </form> </div> <div class=\"modal-footer\"> <button class=\"btn btn-primary\" ng-disabled=\"modalForm.$invalid\" ng-click=\"modal.saveUser(modal.form.name, modal.form.company)\">Ok, mehet</button> </div> </div> </div>");
}]);
