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
        // item.ix = ix;
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
        $scope.lunchList.push($scope.search.singleton);
        for (var i=0; i < $scope.friends.length; i++) {
          if ($scope.friends[i].email == $scope.search.singleton.email) {
            $scope.friends.splice(i, 1);
            break;
          }
        }
        $scope.search = {};
      } else if ($scope.search.validemail) {
        $scope.lunchList.push({email: $scope.search.text});
        // TODO send email, have ajax track status of that invite
        $scope.search = {};
      }
    }
  }

  var lunchMap = {};

  listCallback = function (list) {
    $scope.friends = [];
    angular.forEach(list, function(item, ix) {
      if (item.email && !/@fut.io/.test(item.email) && !lunchMap[item.email] &&
        !/@(reply|groups).facebook.com/.test(item.email)) {
        item.searchString = item.name.toLowerCase() + ' ' + item.email.toLowerCase()
        item.ix = $scope.friends.length;
        $scope.friends.push(item);
      }
    });
    // $scope.friends = list;
    console.log("$scope.friends[1]", $scope.friends[1]);
    $scope.$apply();
  }

  var user = {
    email: "malcolm.m.ocean@gmail.com"
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

setTimeout(function () {
  listCallback([
    {
      name: "Noah MacCallum",
      email: "noahmacca@gmail.com",
    },
    {
      name: "Adam Euerby",
      email: "aeuerby@gmail.com",
    },
    {
      name: "Alisa McClurg",
      email: "amcclurg@outlook.com",
    },
    {
      name: "Amanda Comeau",
      email: "amanda.comeau9@gmail.com",
    },
    {
      name: "Benjamin Carr",
      email: "benjamin.f.carr@gmail.com",
    },
    {
      name: "Charlotte Clarke",
      email: "accredo.et.amo@gmail.com",
    },
    {
      name: "Connor Turland",
      email: "connorturland@gmail.com",
    },
    {
      name: "Emma Dines",
      email: "emmadines@gmail.com",
    },
    {
      name: "Jean Robertson",
      email: "jean@viewpointonchange.com",
    },
    {
      name: "Tanya Williams",
      email: "friendsofthefloor@gmail.com",
    },
  ]);
}, 20);
