(function() {
  'use strict';

  angular.module('user').controller('PublicController', PublicController);

  PublicController.$inject = ['currentUser', 'userService', 'tournamentService', 'APP_CONFIG'];

  function PublicController(currentUser, userService, tournamentService, APP_CONFIG) {
    let vm = this;
    let tour = tournamentService;

    vm.user = currentUser;
    vm.matches = tour.data.matches;
    vm.now = new Date().getTime();
    vm.start = APP_CONFIG.startTime;

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
