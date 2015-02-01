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
    $http.post('/add', who).success(callback);
  }
  $scope.lunchList = [];
  $scope.addByClick = function (friend) {
    if (friend && friend.ix > -1) {
      $scope.lunchList.push($scope.friends.splice(friend.ix, 1)[0]);
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
        $scope.search = {};
      } else if ($scope.search.validemail) {
        $scope.lunchList.push({email: $scope.search.text, ix: $scope.lunchList.length});
        // TODO send email, have ajax track status of that invite
        $scope.search = {};
      }
    }
  }

  var user = {
    email: "malcolm.m.ocean@gmail.com"
  }

  var lunchMap = {};

  listCallback = function (list) {
    $scope.friends = [];
    angular.forEach(list, function(item, ix) {
      if (item.email && !/@fut.io/.test(item.email) && !lunchMap[item.email] &&
        // !/@(reply|groups).facebook.com/.test(item.email) &&
        // !/@\w*.?craigslist.org/.test(item.email) &&
        // !/^support@/.test(item.email) &&
        /@gmail.com/.test(item.email)
        ) {
        var friend = {
          email: item.email,
          name: item.name,
          searchString: item.name.toLowerCase() + ' ' + item.email.toLowerCase(),
          ix: $scope.friends.length
        }
        $scope.friends.push(friend);
      }
    });
    // $scope.friends = list;
    console.log("$scope.friends[1]", $scope.friends[1]);
    $scope.$apply();

    console.log("JSON.stringify($scope.friends).length", JSON.stringify($scope.friends).length);

    $http.post('/'+user.email+'/contactsInMemory', $scope.friends);
  }
  $(function () {
    $http.get('/'+user.email+'/contactsInMemory').success(function (friends) {
      console.log("contactsInMemory", friends);
      if (!$scope.friends) {
        $scope.friends = friends;
      }
    });
  });

  $scope.removeFromList = function (person) {
    person.deleting = true; // TODO use for spinner
    $http.delete('/'+user.email+'/lunchList/'+person.email).success(function () {
      for (var i = 0; i < $scope.lunchList.length; i++) {
        if ($scope.lunchList[i].email === person.email) {
          $scope.lunchList.splice(i, 1);
          break;
        }
      }
      // console.log("==========================================");
      // console.log("==========================================");
      // console.log("THIS NEEDS TO ACTUALLY LOOK THROUGH THINGS");
      // console.log("==========================================");
      // console.log("==========================================");
    });
  }

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
});
