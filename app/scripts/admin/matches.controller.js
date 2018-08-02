(function() {
  'use strict';

  angular.module('admin').controller('MatchesController', MatchesController);

  MatchesController.$inject = ['tournamentService'];

  function MatchesController(tournamentService) {
    let vm = this;
    let tour = tournamentService;
    vm.uploadForm = false;
    vm.data = tour.data;
    vm.table = {};
    vm.table.sortColumn = 'datetime';
    vm.table.reverse = false;
    vm.table.editResult = false;

    vm.reset = function(form) {
      vm.form = {};

      form.$setPristine();
      form.$setUntouched();
    };

    vm.upload = function(matches, form) {
      tour.uploadMatches(matches)
      .then(matches => {
        if (matches) {
          toastr.success('Jogos importados com sucesso!');
          vm.uploadForm = false;
          vm.reset(form);
        }
      })
      .catch(error => {
        toastr.error(error.message);
      });
    };

    vm.updateResult = function(match, result) {
      tour.updateResult(match, result)
      .then(resp => {
        if (result) {
          toastr.success(match.home.longName + ' x ' + match.away.longName + ' resultado do jogo: ' + match.result.home + 'x' + match.result.away);
          vm.table.result[match.$id] = null;
        } else {
          toastr.success(match.home.longName + '-' + match.away.longName + ' resultado da partida excluído.');
        }

        vm.table.editResult = false;
      })
      .catch(error => {
        console.log(error);
        toastr.error('ERROR: ' + error.message);
      });
    };

    vm.updateResults = function() {
      tour.data.matches.forEach(match => {
        console.log(match.result.home + match.result.away);
        tour.updateResult(match, match.result.home + match.result.away)
        .then(resp => {
          toastr.success(match.home.longName + ' x ' + match.away.longName + ' resultado do jogo: ' + match.result.home + 'x' + match.result.away);
          
        })
      });
    }
  }
})();
