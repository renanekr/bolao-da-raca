(function() {
  'use strict';

  angular.module('admin').controller('RankingController', RankingController);

  RankingController.$inject = ['$window', 'userList', 'userService', 'adminService', 'scoreService', 'APP_CONFIG'];

  function RankingController($window, userList, userService, adminService, scoreService, APP_CONFIG) {
    let vm = this;
    
    vm.players = userList;
    vm.leagues = APP_CONFIG.leagues;
    vm.orderBy = 'name';
    vm.reverse = false;
    // vm.leagueFilter = vm.leagues[0];
    vm.userBets = {};


    vm.getObjSize = function(obj){
      if (obj==null)
        return 0;
      else
        return Object.keys(obj).length;
    };

    vm.filterRanking = function(group){
      // console.log('filterRanking: ' + round);

      vm.players.forEach(element => {
        // console.log(element.name)

        // console.log(element.bets.matches);
        // console.log(Object.values(element.bets.matches));
        var tmpScore = 0;
        if(element.bets != undefined){
          Object.values(element.bets.matches).forEach(match => {
            if(match.points!=undefined){
              if((match.group == group) || (group =='Todas')){
                // console.log(element.name + ' (' + element.uid + '): ' + match.round + ' -> ' + match.points);
                // console.log(element.name + ': ' + match.home + 'x' + match.away + '-> ' + match.points);
                tmpScore += match.points;
              }
            }
          });
        }
        // console.log(element.name + '->' + tmpScore);
        element.totalScore = tmpScore;
        
      });
      
    };

  }
})();
