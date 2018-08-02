(function() {
  'use strict';

  /**
   * @ngdoc overview
   * @name bolaodaracaApp
   * @description
   * # bolaodaracaApp
   *
   * Main module of the application.
   */
  angular.module('bolaodaracaApp', ['appCore', 'myBets', 'user', 'admin']);

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

  angular.module('admin', []);
})();
