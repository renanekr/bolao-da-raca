(function() {
  'use strict';

  angular.module('admin').controller('AdminController', AdminController);

  angular.module('admin').directive('datetimepicker', function() {
    return {
        restrict: 'A',
        require : 'ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
          element.datetimepicker({
            dateFormat:'dd/MM/yyyy hh:mm:ss',
            language: 'pt-BR'
          }).on('changeDate', function(e) {
            ngModelCtrl.$setViewValue(e.date);
            scope.$apply();
          });
        }
    };
});
  AdminController.$inject = ['$state'];

  function AdminController($state) {
    let vm = this;

    vm.state = $state;
  }
})();
