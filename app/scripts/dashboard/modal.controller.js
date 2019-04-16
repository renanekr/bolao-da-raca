(function() {
  'use strict';

  angular.module('appCore').controller('modalController', modalController);

  modalController.$inject = ['$uibModalInstance', 'userService', 'user'];

  function modalController($uibModalInstance, userService, user) {
    let vm = this;
    vm.user = user;

    vm.saveUser = function(name, company) {
      if (!name) {
        throw new Error('Nenhum nome informado');
      }

      user.name = name;

      if (company) {
        user.company = company;
      }

      userService.saveUser(user)
      .then(resp => {
        $uibModalInstance.close('Dados alterados com sucesso!');
      });
    };
  }
})();
