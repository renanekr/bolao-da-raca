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
    vm.betDefault = "";
    vm.betDefaultDate;
    vm.betDefaultHist;
    vm.betDefaultEdit = false;
    vm.phases = APP_CONFIG.phases;

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

    if (user){
      // console.log("Atualizando hora de login", vm.now);
      user.lastLogin = vm.now;
      userService.saveUser(user);
    };

    if (user.bets && user.bets.default){
      // console.log(user.bets.default);
      vm.betDefault = user.bets.default.home + 'x' + user.bets.default.away;
      vm.betDefaultDate = user.bets.default.updated;
      vm.betDefaultHist = user.bets.default.history || {};
    }else{
      vm.betDefaultEdit = true;
      toastr.warning("Você não informou um palpite padrão!", "Palpite Padrão");
      
    };
    // console.log(vm.betDefault);

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

    vm.updateBetDefault = function(bet) {
      var objBet = {};
      var objHistory = {};
      
      if (vm.user){
        objBet = parseBet(bet);
        // console.log(objBet);
        if (vm.user.bets){
          //Save current bet, if exists
          if (vm.user.bets.default)
            objHistory = { 
                away: vm.user.bets.default.away,
                home: vm.user.bets.default.home,
                updated: vm.user.bets.default.updated
            };
          
          //Update bet
          vm.user.bets.default = vm.user.bets.default || {}
          vm.user.bets.default['home'] = objBet.home;
          vm.user.bets.default['away'] = objBet.away;
          vm.user.bets.default['updated'] = objBet.updated;
          //Update bet history
          var historySize = vm.user.bets.default.history == undefined ? 0 : Object.keys(vm.user.bets.default.history).length;
          if(historySize == 0){
            vm.user.bets.default['history'] = {0: objHistory };
          }else{
            vm.user.bets.default.history[historySize] = objHistory;
          }
        }else{
          vm.user['bets'] = { default: objBet };
        }
        userService.saveUser(user)
        .then(() => {
          if (user) {
            toastr.success("Palpite padrão salvo com sucesso!");
            vm.betDefaultEdit = false;
          }
        });
        vm.loadBetDefault(user.bets.default);
      }
    };

    vm.submitBetDefaultOnEnter = function(event, bet) {
      if (event.keyCode === 13) {
        // console.log("submitBetDefaultOnEnter", bet);
        vm.updateBetDefault(bet);
      }
    };

    vm.loadBetDefault = function(bet) {
      // console.log("loadBetDefault", bet)
      if (bet) {
        vm.betDefault = bet.home + "x" + bet.away;
        vm.betDefaultDate = vm.now;
      }
    };

    function parseBet(bet) {
      let regexp = new RegExp('^[0-9].*[0-9]$');
      let home;
      let away;
      let updated;
      
      bet = bet.trim();

      if (regexp.test(bet)) {
        bet = bet.split("");

        home = bet[0];
        away = bet[bet.length - 1];
      } else {
        throw new Error('O formato do palpite é inválido');
      }

      return {
        home: home,
        away: away,
        updated: vm.now
      };
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
