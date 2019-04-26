(function() {
  'use strict';

  angular.module('user').factory('userService', userService);

  userService.$inject = ['$q', '$firebaseObject', '$firebaseArray', '$firebaseAuthService', '$firebaseRef', '$state', 'APP_CONFIG', 'adminService'];

  function userService($q, $firebaseObject, $firebaseArray, $firebaseAuthService, $firebaseRef, $state, APP_CONFIG, adminService) {
    const auth = $firebaseAuthService;
    let users = $firebaseArray($firebaseRef.users);
    let usersPublic = $firebaseArray($firebaseRef.public);

    auth.$onAuthStateChanged(newData => {
      if (newData) {
        if ($state.current.name === 'login' || $state.current.name === 'register') {
          $state.go('app.dashboard', {temporary: false}); // TODO: temp password flow is broken
        }
      } else {
        $state.go('login');
      }
    });

    function getUser(uid) {
      return users.$loaded()
      .then(ref => {
        // console.log('getUser',ref.$getRecord(uid));
        return ref.$getRecord(uid);
      });
    }

    function getUserTotalBets(uid) {
      //NAO RETORNA O TAMANHO DO ARRAY
      console.log('getUserTotalBets');
      let matchesRef = firebase.database().ref('users/' + uid + '/bets/matches')
      console.log(matchesRef);
      let matches = $firebaseArray(matchesRef);
      console.log(matches);
      if (matches) {
        return matches.length;
      } else {
        let error = ("Falha ao carregar palpites");

        return $q.reject(error);
      }
    };

    function getUserMatchBets(uid) {
      // console.log(uid);
      // console.log(APP_CONFIG.fbUrl + 'users/' + uid + '/bets/matches');
      
      // let matchesRef = new Firebase(APP_CONFIG.fbUrl + 'users/' + uid + '/bets/matches');
      let matchesRef = firebase.database().ref('users/' + uid + '/bets/matches')
      let matches = $firebaseArray(matchesRef);

      if (matches) {
        return matches.$loaded();
      } else {
        let error = ("Falha ao carregar palpites");

        return $q.reject(error);
      }
    }

    function getUserList() {
      return users.$loaded();
    };

    function getUserActiveList() {
      var activeUsers = [];

      return users.$loaded()
      .then(users => {
        // console.log('getUserActiveList', users);
        users.forEach(user => {
          // console.log(user);
          if(user.active) activeUsers.push(user)
        });
        // console.log(activeUsers);
        return activeUsers;
      });
    };

    function login(credentials) {
      console.log('userService.login', credentials);
      let date = new Date();

      return auth.$signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(data => {
        // console.log('data',data);
        return getUser(data.uid);
      })
      .then(user => {
        // console.log('user',user);
        if(user) {
          user.lastLogin = date.getTime();
          return saveUser(user);
        }
      });
    }

    function logout() {
      auth.$signOut();
    }

    function createUser(newUid, newEmail, newName, newLeague) {
      let userObject = $firebaseObject($firebaseRef.users);
      return userObject.$loaded()
      .then(userObj => {
        let date = new Date();

        let newUser = {
          email: newEmail,
          name: newName,
          createdAt: date.getTime(),
          admin: false,
          active: true,
          uid: newUid,
          league: [newLeague],
          totalScore: 0,
          extraPoints: 0,
          exactResults: 0
        };
        userObj[newUid] = newUser;

        return userObj.$save();
      })
      .then(resp => {
        return usersPublic.$loaded();
      })
      .then(publicData => {
        return publicData.$add({
          uid: newUid,
          email: newEmail,
          name: newName,
          // active: true,
          league: [newLeague],
          score: 0
        });
      });
    };

    function register(credentials) {
      let newUid, pending, pendingList;

      return adminService.getPendingList()
      .then(list => {
        pendingList = list;
        pending = list.find(item => {
          let lower = item.email.toLowerCase();

          return lower === credentials.email;
        });

        if (!pending) {
          let error = new Error('Você não pode se registrar com este endereço de e-mail. Entre em os organizadores (Renan ou Betão)!');

          return $q.reject(error);
        } else {
          return auth.$createUserWithEmailAndPassword(credentials.email, credentials.password);
        }
      })
      .then(data => {
        newUid = data.uid;

        return auth.$signInWithEmailAndPassword(credentials.email, credentials.password);
      })
      .then(() => {
        pendingList.$remove(pending);

        let userObject = $firebaseObject($firebaseRef.users);

        return userObject.$loaded();
      })
      .then(userObj => {
        let date = new Date();

        let newUser = {
          email: credentials.email,
          createdAt: date.getTime(),
          admin: false,
          active: true,
          uid: newUid,
          exactResults: 0,
          league: [pending.league]
        };

        userObj[newUid] = newUser;

        return userObj.$save();
      })
      .then(resp => {
        return usersPublic.$loaded();
      })
      .then(publicData => {
        return publicData.$add({
          uid: newUid,
          email: newEmail,
          // active: true,
          league: [pending.league],
          score: 0,
          exactResults: 0,
        });
      });
    }

    function saveUser(user) {
      // console.log('saveUser: ', user);

      return users.$save(user)
      .then(ref => {
          return usersPublic.$loaded();
      })
      .then(publicData => {
        let found = publicData.find(item => {
          return item.uid === user.uid;
        });

        if (!found) {
          // console.log('!found');
          if (user.active){
            // console.log('active');
            return publicData.$add({
              name: user.name || null,
              uid: user.uid,
              score: user.totalScore || 0,
              exactResults: user.exactResults || 0,
              league: user.league,
              bets: user.bets || null,
              email: user.email || null,
              // active: user.active || true //If founded, set true
            })
          } else {
            // console.log('!active');
            return [user]
          }
        } else {
          // console.log('found');
          if (user.active){
            // console.log('active');
            found.name = user.name || null;
            found.score = user.totalScore || 0;
            found.exactResults = user.exactResults || 0;
            found.league = user.league;
            found.bets = user.bets || null;
            found.email = user.email || null;
            // found.active = user.active || false; //fir not founded, set false
  
            return publicData.$save(found)
          } else {
            // console.log('!active');
            return publicData.$remove(found)
          }
        }
      });
    }

    function removeUser(cred, user) {
      return users.$remove(user)
      .then(() => {
        return usersPublic.$loaded();
      })
      .then(publicArray => {
        let found = publicArray.find(item => {
          return item.uid === user.uid;
        });

        return publicArray.$remove(found);
      })
      .then(() => {
        return auth.$deleteUser();
      });
    }

    function resetPassword(credentials) {
      return auth.$sendPasswordResetEmail(credentials.email);
    }

    function changePassword(credentials) {
      // console.log(credentials)
      return auth.$updatePassword(credentials.newPassword);
    }

    return {
      public: usersPublic,
      login: login,
      logout: logout,
      register: register,
      getUser: getUser,
      createUser: createUser,
      getUserTotalBets, getUserTotalBets,
      getUserMatchBets: getUserMatchBets,
      saveUser: saveUser,
      removeUser: removeUser,
      getUserList: getUserList,
      getUserActiveList, getUserActiveList,
      resetPassword: resetPassword,
      changePassword: changePassword
    };
  }
})();
