(function() {
  'use strict';

  angular.module('appCore').controller('MatchController', MatchController);

  MatchController.$inject = ['match', 'user', 'userService', 'APP_CONFIG'];

  function MatchController(match, user, userService, APP_CONFIG) {
    let vm = this;
    vm.current = match;
    vm.user = user;
    vm.users = userService.public;

    vm.userList = getUserList(match);
    // console.log(vm.userList);

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
    };
    // match.status = 'closed';
    // console.log('status', match.status);

    function getUserList(match) {
      let prepArray = vm.users.map(thisUser => {
        let prepUser = {};
        let matchUser = {};

        prepUser.name = thisUser.name;
        prepUser.league = thisUser.league;
        prepUser.uid = thisUser.uid;
        // console.log(thisUser);
        // console.log(thisUser.bets.matches);
        if (thisUser.bets && thisUser.bets.matches) {
          prepUser.home = thisUser.bets.matches[match.$id].home;
          prepUser.away = thisUser.bets.matches[match.$id].away;
          prepUser.points = thisUser.bets.matches[match.$id].points;
          console.log('prepUser', prepUser);
        } else {
          // console.log('zero points');
          prepUser.points = 0;
        }

        return prepUser;
      });

      return prepArray;
    };

    vm.matchCss = function(points) {
      // console.log('matchCss', points);
      var cssClass = "label-";

      switch (points){
        case 15:
        case 12:
          cssClass = cssClass + "success"
          break;
        case 9:
          cssClass = cssClass + "primary"
          break;
        case 6:
          cssClass = cssClass + "default"
          break;
        case 4:
          cssClass = cssClass + "info"
          break;
        case 3:
          cssClass = cssClass + "warning"
          break;
        default:
          cssClass = cssClass + "danger"
          break;
      };

      return cssClass;
    }
    
  }
})();
