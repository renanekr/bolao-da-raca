(function() {
  'use strict';

  angular.module('admin').controller('ConfigController', ConfigController);

  ConfigController.$inject = ['$window', 'user', 'userService', 'tournamentService'];

  function ConfigController($window, user, userService, tournamentService) {
    let vm = this;

    vm.tour = tournamentService.data.config;
    vm.user = user;
    vm.form = {};

    vm.editParam = function(param) {
    };

    vm.saveParam = function(param, newValue) {
      if (newValue && newValue !== user[param]) {
        user[param] = newValue;

        userService.saveUser(user)
        .then(resp => {
          toastr.success('Configurações salvas!');
        })
        .catch(error => {
          toastr.error(error.message);
        });
      }

      vm.form[param] = false;
    };

    vm.changePassword = function(form) {
      let credentials = {
        email: user.email,
        newPassword: form.password,
        oldPassword: form.oldPassword
      };

      userService.changePassword(credentials)
      .then(resp => {
        toastr.success("Elmentettük az új jelszavadat");
        vm.showPasswordChange = false;
      })
      .catch(error => {
        console.error(error);
      });
    };

    vm.reset = function(form) {
      form.$setPristine();
      form.$setUntouched();
    };
  }
})();
