(function() {
  'use strict';

  angular.module('appCore').controller('DashboardController', DashboardController);

  DashboardController.$inject = ['$state', '$interval', 'userService', 'adminService', 'tournamentService', 'user', '$uibModal', 'APP_CONFIG'];

  function DashboardController($state, $interval, userService, adminService, tournamentService, user, $uibModal, APP_CONFIG) {
    let vm = this;

    vm.tour = tournamentService;
    vm.user = user;
    vm.users = userService.public;
    vm.timeLimit = APP_CONFIG.timeLimit;
    vm.leagues = APP_CONFIG.leagues;
    vm.leagueFilter = APP_CONFIG.currentLeague;
    vm.promo = adminService.promo;

    vm.now = new Date().getTime();

    // vm.rankingLastUpdate = tournamentService.getRankingLastUpdate()
    // .then(lastUpdate => {
    //   return lastUpdate
    // })
    // console.log('DASH vm.rankingLastUpdate: ' + vm.rankingLastUpdate);

    $interval(() => {
      vm.now = new Date().getTime();
    }, 10000);

    // console.log('user.alerts', user.alerts);
    // console.log('user.alerts.ruleAlert', user.alerts.ruleAlert);
    // if (user.alerts.ruleAlert) {
    //   console.log("Show rule alert")
    //   let ruleModal = $uibModal.open({
    //     templateUrl: 'views/rule_modal.html',
    //     controller: 'RuleModalController',
    //     controllerAs: 'ruleModal',
    //     animation: true,
    //     backdrop: 'static',
    //     resolve: {
    //       user: () => {
    //         return user;
    //       }
    //     }
    //   });
    // 
    //   ruleModal.result
    //   .then(result => {
    //     toastr.success(result);
    //   })
    //   .catch(error => {
    //     console.error(error);
    //   });
    // }

    if(user){
      // console.log("Atualizando hora de login", vm.now);
      user.lastLogin = vm.now;
      userService.saveUser(user);
    };

    if (user.league && user.league.length) {
      // console.log('user.league', user.league)
       vm.leagueFilter = user.league[0];
      //vm.leagueFilter = user.league;
    }

    if ($state.params.temporary) {
      let tempModal = $uibModal.open({
        templateUrl: 'views/password_modal.html',
        controller: 'PasswordController',
        controllerAs: 'password',
        animation: true,
        backdrop: 'static',
        keyboard: false,
        size: 'sm',
        resolve: {
          user: function() {
            return user;
          }
        }
      });

      tempModal.result.then(result => {
        toastr.success(result);
      })
      .catch(error => {
        console.error(error);
      });
    }

    if (!user.name) {
      console.log("User name not found. Show welcome modal");
      let modalInstance = $uibModal.open({
        templateUrl: 'views/welcome_modal.html',
        controller: 'modalController',
        controllerAs: 'modal',
        animation: true,
        backdrop: 'static',
        keyboard: false,
        resolve: {
          user: function() {
            return user;
          }
        }
      });

      modalInstance.result.then(result => {
        toastr.success(result);
      })
      .catch(error => {
        console.error(error);
      });
    }

    // console.log(vm.promo.validTo);
    vm.showPromo = function(promo, user) {
      if (vm.now < vm.promo.validTo) {
        let match = user.league.find(league => {
          return promo.league === league;
        });

        return match;
      } else {
        return false;
      }
    };

    vm.replyToPromo = function(promo, user, answer) {
      adminService.addPromoReply(promo, user, answer)
      .then(() => {
        toastr.success("Obrigado pelo feedback!");
      })
      .catch(error => {
        console.error(error);
      });
    };

    vm.getObjSize = function(obj){
      if(obj==null)
        return 0;
      else
        return Object.keys(obj).length;
    };

    vm.changeTournament = function(league){
      //Não utilizada ainda
      console.log('changeTournament to', league);
      vm.leagueFilter = league;
    };

    vm.filterRanking = function(group){
      vm.users.forEach(element => {
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
        element.score = tmpScore;
        
      });
    };

  }
})();
