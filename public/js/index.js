// var deps = ["ui.bootstrap"];
var app = angular.module("justlunchme", [])
app.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});

var KEYS = {
  ENTER: 13
}

app.filter('listfilter', [function () {
  return function(items, search) {
    if (!search || !search.text) {
      return items;
    }
    var filtered = [];
    search.text = search.text.toLowerCase();
    angular.forEach(items, function(item) {
      if( item.email.toLowerCase().indexOf(search.text) >= 0 ) filtered.push(item);
    });
    search.singleton = undefined;
    search.validemail = undefined;
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
  $scope.addByClick = function (ix) {
    if (ix > -1) {
      $scope.lunchList.push($scope.friends.splice(ix, 1)[0]);
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
  $scope.friends = [
    {
      email: "Noah MacCallum <noahmacca@gmail.com>",
    },
    {
      email: "Adam Euerby <aeuerby@gmail.com>",
    },
    {
      email: "Alisa McClurg <amcclurg@outlook.com>",
    },
    {
      email: "Amanda Comeau <amanda.comeau9@gmail.com>",
    },
    {
      email: "Benjamin Carr <benjamin.f.carr@gmail.com>",
    },
    {
      email: "Charlotte Clarke <accredo.et.amo@gmail.com>",
    },
    {
      email: "Connor Turland <connorturland@gmail.com>",
    },
    {
      email: "Emma Dines <emmadines@gmail.com>",
    },
    {
      email: "Jean Robertson <jean@viewpointonchange.com>",
    },
    {
      email: "Tanya Williams <friendsofthefloor@gmail.com>",
    },
  ]
});
