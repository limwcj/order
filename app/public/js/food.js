/**
 * Created by wangchengjie on 2018/8/10.
 */
'use strict';
const groupId = lm.getCookie('groupId');

if (groupId) {
  $(`<div class="dialog-mygroup-title"><span>${lm.htmlEncode(lm.getCookie('groupName'))}</span> <span class="fa fa-plus-circle" onclick="addFoodInput()"></span></div>`).prependTo($('.dialog'));
  getFood({groupId: groupId}, function (result) {
    var _left = $('body').width() * 0.05;
    result.forEach(function (i, index) {
      $(buildFoodCard(i.foodId, i.creator, i.location, new Date(i.createDate), i.foodName)).appendTo($('#foods')).css({left: '-500px'})
        .animate({
          left: _left + 10 + 'px',
          opacity: 1
        }, 500 / result.length * (index + 1)).animate({left: _left + 'px'}, 'fast');
    });
  })
} else {
  tip('加入饭团才可以看到餐库哦', () => {location.href = 'group.html'});
}

$('.dialog-mygroup-title span:first-child').on('click', function () {
  lm.delCookie('groupId');
  lm.delCookie('groupName');
  location.reload();
});

function addFoodSubmit(self) {
  var $self = $(self);
  var foodName = $self.prevAll().eq(1).val().replace(new RegExp(/\s*/g), '');
  var location = $self.prevAll().eq(0).val().replace(new RegExp(/\s*/g), '');
  if (!foodName && !location) return addFoodInput();
  addFood({groupId: groupId,foodName: foodName, location: location}, function (data) {
    if (data.code == 0) {
      var $selfParent = $self.parent();
      $selfParent.animation(10, 5, function () {
        $selfParent.after($(buildFoodCard(data.result.foodId, lm.getCookie('userName'), location, new Date(), foodName))
          .css({left: parseInt($selfParent.offset().left) + 'px', opacity: 1}));
        $selfParent.hide().find('input').val('');
      });
    } else {
      tip(data.message);
    }
  });
}

function buildFoodCard(foodId, userName, location, date, foodName) {
  return `<div class="food-li" data-foodid="${foodId}">
      <div><span>${lm.htmlEncode(userName)}</span>
      <span onclick="addLocationInput(this)" data-location="${lm.htmlEncode(location)}">${lm.htmlEncode(location)}</span>
      <span>${lm.htmlEncode(lm.date.formatDate(date, 'yyyy-MM-dd'))}</span></div>
      <div class="food-li-name" onclick="addFoodNameInput(this)" data-foodname="${lm.htmlEncode(foodName)}"><span>${lm.htmlEncode(foodName)}</span></div>
  </div>`;
}

function addFoodInput() {
  var $addFood = $('.add-food');
  if ($addFood.is(':hidden')) {
    return $addFood.slideDown().find('input').eq(0).focus();
  }
  $addFood.slideUp();
}

function addLocationInput(self) {
  var $self = $(self);
  if ($self.find('input').length) return;
  var location = $self.data('location');
  $self.html($(`<input type="text" maxlength="20" autofocus>`).val(location));
  $self.find('input').focus().on('blur', function () {
    var newLocation = $(this).val().replace(new RegExp(/\s*/g), '');
    if (location == newLocation) return $self.html(lm.htmlEncode(newLocation));
    updateFood({
      groupId: groupId,
      location: newLocation,
      foodId: $self.parent().parent().data('foodid')
    }, function (data) {
      if (data.code == 0) {
        $self.html(lm.htmlEncode(newLocation)).data('location', newLocation);
      } else {
        $self.html(lm.htmlEncode(location)).data('location', location);
        tip(data.message);
      }
    });
  }).on('keydown', function (e) {
    if (e.keyCode == 13) {
      $(this).blur();
    }
  });
}

function addFoodNameInput(self) {
  var $self = $(self);
  if ($self.find('input').length) return;
  var foodName = $self.data('foodname');
  $self.html($(`<input type="text" maxlength="20" autofocus>`).val(foodName));
  $self.find('input').focus().on('blur', function () {
    var newName = $(this).val().replace(new RegExp(/\s*/g), '');
    if (foodName == newName) return $self.html(lm.htmlEncode(newName));
    updateFood({foodName: newName, foodId: $self.parent().data('foodid')}, function (data) {
      if (data.code == 0) {
        $self.html(lm.htmlEncode(newName)).data('foodname', newName);
      } else {
        $self.html(lm.htmlEncode(foodName)).data('foodname', foodName);
        tip(data.message);
      }
    });
  }).on('keydown', function (e) {
    if (e.keyCode == 13) {
      $(this).blur();
    }
  });
}

function updateFood(params, callback) {
  $.ajax({
    url: '/food/updateFood',
    type: 'post',
    data: params,
    dataType: 'json',
    success: function (data) {
      callback(data);
    }
  });
}

function getFood(params, callback) {
  $.ajax({
    url: '/food/getFood',
    type: 'post',
    data: params,
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        callback(data.result);
      } else {
        tip(data.message);
      }
    }
  });
}

function addFood(params, callback) {
  $.ajax({
    url: '/food/addFood',
    type: 'post',
    data: params,
    dataType: 'json',
    success: function (data) {
      callback(data);
    }
  });
}