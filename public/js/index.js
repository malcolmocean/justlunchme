// var deps = ["ui.bootstrap"];
var app = angular.module("justlunchme", [])
app.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});

var KEYS = {
  ENTER: 13
}

app.filter('searchfilter', [function () {
  return function(items, search) {
    if (!search || !search.text) {
      return items;
    }
    items && console.log("items.length", items.length);
    search.text = search.text.toLowerCase();
    var filtered = [];
    angular.forEach(items, function(item, ix) {
      if (item && item.searchString.indexOf(search.text) >= 0 ) {
        item.ix = ix;
        filtered.push(item);
      }
    });
    search.singleton = undefined;
    search.validemail = undefined;
    search.filtered = filtered;
    search.size = filtered.length;
    if (search.size == 1) {
      search.singleton = filtered[0];
    } else if (search.size === 0) {
      search.validemail = /(.+)@(.+){2,}\.(.+){2,}/.test(search.text);
    }
    return filtered;
  };
}]);

app.controller('UserPickerCtrl', function ($scope, $http) {
  $scope.sendAddToServer = function (who, callback) {
    $http.post('/'+user.email+'/add', who).success(callback);
  }
  $scope.lunchList = [];
  $scope.addByClick = function (friend) {
    if (friend && friend.ix > -1) {
      $scope.lunchList.push($scope.friends.splice(friend.ix, 1)[0]);
      angular.forEach($scope.friends, function(item, ix) {
        item.ix = ix;
      });
    } else if ($scope.search.validemail) {
      $scope.lunchList.push({email: $scope.search.text})
      $scope.search = {};
    }
    console.log("$scope.lunchList", $scope.lunchList);
    $scope.sendAddToServer($scope.lunchList[$scope.lunchList.length-1], function (result) {
      console.log("result", result);
    })
  }
  $scope.searchKeypress = function ($event) {
    if ($event.charCode == KEYS.ENTER) {
      if ($scope.search.singleton) {
        $scope.search.singleton.ix = $scope.lunchList.length;
        $scope.lunchList.push($scope.search.singleton);
        for (var i=0; i < $scope.friends.length; i++) {
          if ($scope.friends[i].email == $scope.search.singleton.email) {
            $scope.friends.splice(i, 1);
            break;
          }
        }
        angular.forEach($scope.friends, function(item, ix) {
          item.ix = ix;
        });
        $scope.search = {};
      } else if ($scope.search.validemail) {
        $scope.lunchList.push({email: $scope.search.text, ix: $scope.lunchList.length});
        // TODO send email
        $scope.search = {};
      } else {
        return; // so you don't send add // TODO fix hack
      }
      $scope.sendAddToServer($scope.lunchList[$scope.lunchList.length-1], function (result) {
        console.log("result", result);
      })
    }
  }

  var lunchMap = {};
  var fullMap = {};

  listCallback = function (list) {
    $scope.friends = [];
    angular.forEach(list, function(item, ix) {
      if (item.email && !/@fut.io/.test(item.email) && !lunchMap[item.email] &&
        // !/@(reply|groups).facebook.com/.test(item.email) &&
        // !/@\w*.?craigslist.org/.test(item.email) &&
        // !/^support@/.test(item.email) &&
        /@gmail.com/.test(item.email)
        ) {
        if (fullMap[item.email] > -1) {
          if (!$scope.friends[fullMap[item.email]].name) {
            $scope.friends[fullMap[item.email]].name = item.name;
            $scope.friends[fullMap[item.email]].searchString = item.name.toLowerCase() + ' ' + item.email.toLowerCase();
          }
        } else {
          var friend = {
            email: item.email,
            name: item.name,
            searchString: item.name.toLowerCase() + ' ' + item.email.toLowerCase(),
            ix: $scope.friends.length
          }
          fullMap[item.email] = friend.ix;
          $scope.friends.push(friend);
        }
      }
    });
    $scope.$apply();
  }

  authCallback = function (user) {
    $http.get('/'+user.email+'/lunchList').success(function (list) {
      if ($scope.lunchList && $scope.lunchList.length) {
        $scope.lunchList = $scope.lunchList.concat(list);
      } else {
        $scope.lunchList = list;
      }
      for (var i=0; i<$scope.lunchList.length; i++) {
        lunchMap[$scope.lunchList[i].email] = true;
      }
    });
  }

  $scope.removeFromList = function (person) {
    person.deleting = true; // TODO use for spinner
    $http.delete('/'+user.email+'/lunchList/'+person.email).success(function () {
      for (var i = 0; i < $scope.lunchList.length; i++) {
        if ($scope.lunchList[i].email === person.email) {
          $scope.lunchList.splice(i, 1);
          break;
        }
      }
    });
  }
});
