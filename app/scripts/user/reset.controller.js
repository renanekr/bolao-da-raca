(function() {
  'use strict';

  angular.module('user').controller('ResetPasswordController', ResetPasswordController);

  ResetPasswordController.$inject = ['$state', 'userService'];

  function ResetPasswordController($state, userService) {
    let vm = this;

    vm.resetPassword = function(email) {
      userService.resetPassword({email: email})
      .then(resp => {
        toastr.success('Sua nova senha foi enviada por e-mail.');

        $state.go('login');
      })
      .catch(error => {
        if (error.message === 'The specified user does not exist.') {
          toastr.error('E-mail não cadastado no bolão');
        } else {
          console.error(error);
        }
      });
    };
  }
})();
