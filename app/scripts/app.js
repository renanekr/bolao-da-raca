(function() {
  'use strict';

  /**
   * @ngdoc overview
   * @name bolaosocialApp
   * @description
   * # bolaodaracaApp
   *
   * Main module of the application.
   */
  angular.module('bolaosocialApp', ['appCore', 'myBets', 'user', 'admin']);

  angular.module('appCore', [
    'ngMessages',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'firebase',
    'angulartics'//,
    // 'angulartics.google.tagmanager'
  ]);

  angular.module('myBets', ['ui.bootstrap']);

  angular.module('user', []);

  angular.module('admin', ['ui.bootstrap.datetimepicker']);
})();
