(function() {
  'use strict';

  angular.module('admin').controller('RankingController', RankingController);

  RankingController.$inject = ['$window', 'userActiveList', 'userService', 'adminService', 'scoreService', 'APP_CONFIG'];

  function RankingController($window, userActiveList, userService, adminService, scoreService, APP_CONFIG) {
    let vm = this;
    
    vm.players = userActiveList;
    vm.leagues = APP_CONFIG.leagues;
    vm.orderBy = 'name';
    vm.reverse = false;
    // vm.leagueFilter = vm.leagues[0];
    vm.phases = APP_CONFIG.phases;
    vm.userBets = {};

    // console.log(vm.players);

    vm.getObjSize = function(obj){
      if (obj==null)
        return 0;
      else
        return Object.keys(obj).length;
    };

    vm.filterRanking = function(group){
      // console.log('filterRanking: ' + round);

      vm.players.forEach(player => {
        // console.log(player.name, player.bets.matches);
        // console.log(Object.values(player.bets.matches));
        var tmpScore = 0;
        if(player.bets != undefined){
          Object.values(player.bets.matches).forEach(match => {
            if(match.points!=undefined){
              if((match.group == group) || (group =='Todas')){
                // console.log(player.name + ' (' + player.uid + '): ' + match.round + ' -> ' + match.points);
                // console.log(player.name + ': ' + match.home + 'x' + match.away + '-> ' + match.points);
                tmpScore += match.points;
              }
            }
          });
        }
        // console.log(player.name + '->' + tmpScore);
        player.totalScore = tmpScore;
        
      });
      
    };

    vm.resetRanking = function(){
      vm.players.forEach(player => {
        console.log(player);
        player.totalScore = 0;
        if(player.bets && player.bets.matches){
          Object.values(player.bets.matches).forEach(match => {
            match.points = 0;
          });
        }
        userService.saveUser(player);
      })
    };

  }
})();
