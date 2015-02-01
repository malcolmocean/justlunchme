// var deps = ["ui.bootstrap"];
var app = angular.module("justlunchme", [])
app.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});

app.controller('UserPickerCtrl', function ($scope) {
  $scope.friends = [
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
