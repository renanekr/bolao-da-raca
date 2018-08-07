(function() {
  'use strict';

  angular.module('user').controller('UserRegisterController', UserRegisterController);

  UserRegisterController.$inject = ['userService'];

  function UserRegisterController(userService) {
    let vm = this;
    vm.loading = false;

    vm.registerUser = function(email, password) {
      vm.loading = true;

      let credentials = {
        email: email.toLowerCase(),
        password: password
      };

      userService.register(credentials)
      .catch(error => {
        if (error === "IE Object doesn't support property or method 'find'") {
          vm.errorMessage = "O sistema não é suportado neste navegador. Entre com Chrome ou o Firefox!";
        }

        vm.loading = false;
        toastr.error(error.message);
        console.error(error);
      });
    };
  }
})();
