(function() {
  'use strict';

  angular.module('admin').controller('ParticipantsController', ParticipantsController);

  ParticipantsController.$inject = ['$window', 'userList', 'pendingList', 'userService', 'adminService', 'scoreService', 'APP_CONFIG'];

  function ParticipantsController($window, userList, pendingList, userService, adminService, scoreService, APP_CONFIG) {
    let vm = this;
    vm.players = userList;
    vm.pending = pendingList;
    vm.leagues = APP_CONFIG.leagues;
    vm.orderBy = 'name';
    vm.reverse = false;
    vm.leagueFilter = vm.leagues[0];
    vm.promo = adminService.promo;

    vm.makeUserAdmin = function(user) {
      user.admin = true;

      userService.saveUser(user)
      .then(() => {
        toastr.success(user.email + ' tornou-se administrador.');
      })
      .catch(error => {
        toastr.error(error);
      });
    };

    vm.makeUserSimple = function(user) {
      user.admin = false;

      userService.saveUser(user)
      .then(() => {
        toastr.error(user.email + ' NÃO é mais administrador.');
      })
      .catch(error => {
        toastr.error(error);
      });
    };

    vm.addNewEmails = function(list, league) {
      if (list) {
        list = list.replace(/\n/g, '');

        let array = list.trim().split(',');

        let lowerCaseArray = array.map(item => {
          return item.toLowerCase();
        });

        adminService.addNewEmails(lowerCaseArray, league)
        .then(resp => {
          if (resp.length) {
            toastr.success(resp.length + ' novos endereços adicionados à fila');

            vm.form.newEmails = undefined;
            vm.showAddEmails = false;
          } else {
            toastr.warning(resp.length + ' um novo título foi adicionado à lista de espera');
          }
        })
        .catch(error => {
          console.error(error);
        });
      }
    };

    vm.deletePending = function(item) {
      adminService.deletePending(item)
      .then(resp => {
        toastr.success(item.email + ' cancelado');
      })
      .catch(error => {
        console.error(error);
      });
    };

    vm.checkLeague = function(user, league) {
      if (user.league && user.league.length) {
        return user.league.find(item => {
          return item === league;
        });
      } else {
        return false;
      }
    };

    vm.addLeague = function(user, league) {
      user.league = user.league || [];

      user.league.push(league);

      userService.saveUser(user)
      .then(() => {
        toastr.success(user.name + ' a ' + league + ' tornou-se um membro');
      })
      .catch(error => {
        toastr.error(error);
      });
    };

    vm.addExtraPoints = function(user, points) {
      user.extraPoints = user.extraPoints || 0;
      user.extraPoints += points;

      if (user.extraPoints < 7) {
        userService.saveUser(user)
        .then(() => {
          return scoreService.updateUserScores();
        })
        .then(() => {
          console.log("Recalculated");
        })
        .catch(err => {
          console.error(err);
        });
      } else {
        toastr.error("Máximo 6 pontos extras permitidos");
      }
    };
  }
})();
