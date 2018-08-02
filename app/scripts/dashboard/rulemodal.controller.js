(function() {
  'use strict';

  angular.module('appCore').controller('RuleModalController', RuleModalController);

  RuleModalController.$inject = ['$uibModalInstance', 'userService', 'user'];

  function RuleModalController($uibModalInstance, userService, user) {
    let vm = this;
    vm.user = user;

    console.log(vm.user);
    vm.turnOffAlert = function(user) {
      user.alerts = user.alers || {};
      user.alerts.ruleAlert = false; //true mostra o modal das regras

      userService.saveUser(user)
      .then(user => {
        $uibModalInstance.close('Ok! Você não receberá mais notificações.');
      });
    };

    vm.closeAlert = function() {
      $uibModalInstance.close();
    };
  }
})();
