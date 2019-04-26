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

    vm.getUserTotalBets = function(uid) {
      var total;
      // return userService.getUserTotalBets(uid);
      console.log(uid);
    };

    vm.activateUser = function(user) {
      var msg;
      // console.log(user);
      user.active = !user.active;
      msg = user.active ? 'ativado' : 'inativado';

      userService.saveUser(user)
      .then(() => {
        toastr.success(user.email + ' foi ' + msg + '.');
      })
      .catch(error => {
        toastr.error(error);
      });
    };

    vm.adminUser = function(user) {
      var msg;
      // console.log(user);
      user.admin = !user.admin;
      msg = user.admin ? 'tornou-se' : 'NÃO é mais';

      userService.saveUser(user)
      .then(() => {
        toastr.success(user.email + ' ' + msg + ' administrador.');
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

    vm.addNewParticipant = function(uid, email, name, league) {
      // console.log('addNewParticipants');
      // console.log('uid: ' + uid + ', email: ' + email + ', name: ' + name + ', liga: ' + league);

      userService.createUser(uid, email, name, league)
      .then(resp => {
        toastr.success('Usuário ' + name + ' adicionado com sucesso!');
        vm.form.uid = undefined;
        vm.form.email = undefined;
        vm.form.name = undefined;
        vm.showAddParticipant = false;
      })
      .catch(error => {
        console.error(error);
      });

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

      userService.saveUser(user,false)
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