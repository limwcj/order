/**
 * Created by wangchengjie on 2018/8/3.
 */
'use strict';
const userId = lm.getCookie('userId');
const groupId = lm.getCookie('groupId');

var province = 0;
var city = 0;
var district = 0;
var street = 0;

if (groupId) {
  $(
    `<div class="dialog-mygroup dialog-mygroup-title"><span>${lm.htmlEncode(
      lm.getCookie('groupName')
    )}</span>（<span class="fa fa-map-marker"></span>）<span class="fa fa-sign-out"></span></div>`
  ).appendTo($('.dialog'));
  getGroupMembers({ groupId: groupId }, function (result) {
    var $input = $('.searchGroup-input');
    var top = $input.offset().top + 50;
    var left = $('body').width() * 0.025 - 5;
    var height = $input.height();
    var isManager = false;
    result.forEach(function (i, index) {
      if (userId == i.userId && i.position == 1) isManager = true; //TODO 管理员踢人
      var _top = top + height + (height + 10) * index + 35;
      $(`<div class="dialog-mygroup dialog-mygroup-member" data-userId="${i.userId}">
            <div>${lm.htmlEncode(i.username) || '未知用户'}</div>
            <div>${
              userId == i.userId
                ? `<span style="color: #4BD0FD">自己${i.position == 1 ? '（团长）' : ''}</span>`
                : i.position == 1
                ? '<span style="color: red">团长</span>'
                : '饭友'
            }</div>
            <div>${i.createDate}</div>
        </div>`)
        .appendTo($('.dialog'))
        .css({ top: top + 'px', left: left + 'px' })
        .animate({ top: _top + 'px', opacity: 1 }, result.length * 100 + 100 - index * 100)
        .animate({ top: _top - 5 + 'px' }, 'fast');
    });
    let dialogHeight = $('.dialog').height();
    if (result.length > 8)
      $('.dialog').height(dialogHeight > 180 + 50 * result.length ? dialogHeight : 180 + 50 * result.length);
  });
} else {
  tip('试试加入一个饭团吧', true);
}

$('.searchGroup-btn').on('click', function () {
  var groupName = $('.searchGroup-input').val().replace(/\s+/g, '');
  if (!groupName) return;
  if (getStrlen(groupName) >= 30) return tip('请确保30个字符以内');
  if (groupName.length)
    getGroup({ groupName: groupName }, function (result) {
      $('.group-li').remove();
      $('.dialog-mygroup').remove();
      var $input = $('.searchGroup-input');
      var top = $input.offset().top;
      var left = $('body').width() * 0.025 - 5;
      var height = $input.height();
      if (result.length) {
        result.forEach(function (i, index) {
          var _top = top + height + (height + 10) * index + 35;
          $(`<div class="group-li" data-groupId="${i.groupId}">
              <div>${lm.htmlEncode(i.groupName)}</div>
              <div>${lm.htmlEncode(i.creator)}</div>
              <div>${i.createDate}</div>
              <div class="join-group" onclick="joinGroup(${i.groupId})">加入</div></div>`)
            .appendTo($('.dialog'))
            .css({ top: top + 'px', left: left + 'px' })
            .animate({ top: _top + 'px', opacity: 1 }, result.length * 100 + 100 - index * 100)
            .animate({ top: _top - 5 + 'px' }, 'fast');
        });
        var _top = top + height + (height + 10) * result.length + 35;
        $(`<div class="group-li back-to-mygroup">返回我的饭团</div>`)
          .appendTo($('.dialog'))
          .css({ top: top + 'px', left: left + 'px' })
          .animate({ top: _top + 'px', opacity: 1 }, result.length * 100 + 100 - result.length * 100)
          .animate({ top: _top - 5 + 'px' }, 'fast')
          .on('click', function () {
            location.reload();
          });
      } else {
        var _groupName = prompt('饭团不存在，是否创建', groupName);
        if (_groupName) {
          createGroup({ groupName: _groupName }, function (groupId) {
            lm.setCookie('groupId', groupId, 30 * 60 * 1000);
            lm.setCookie('groupName', _groupName, 30 * 60 * 1000);
            location.reload();
          });
        }
      }
    });
});

$('.searchGroup-input').on('keydown', function (e) {
  if (e.keyCode == 13) $('.searchGroup-btn').click();
});

$('.dialog-mygroup-title span:first-child').on('click', function () {
  lm.delCookie('groupId');
  lm.delCookie('groupName');
  location.reload();
});

$('.dialog-mygroup-title span:last-child').on('click', function () {
  var r = confirm('确定退出该饭团吗？');
  if (r) {
    exitGroup(lm.getCookie('groupId'), function () {
      lm.delCookie('groupId');
      lm.delCookie('groupName');
      location.reload();
    });
  }
});

$('.back-btn').on('click', function () {
  $('#map').hide();
});

$('.dialog-mygroup-title span')
  .eq(1)
  .on('click', function () {
    $('#map').show();
    $('.back-btn').show().addClass('fa');
    showMap();
  });

function getGroup(params, callback) {
  $.ajax({
    url: '/api/group/getGroup',
    type: 'post',
    data: params,
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        callback(data.result);
      } else {
        tip(data.message);
      }
    },
  });
}

function createGroup(params, callback) {
  $.ajax({
    url: '/api/group/createGroup',
    type: 'post',
    data: params,
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        callback(data.result);
      } else {
        tip(data.message);
      }
    },
  });
}

function joinGroup(groupId) {
  $.ajax({
    url: '/api/group/joinGroup',
    type: 'post',
    data: { groupId: groupId },
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        location.reload();
      } else {
        tip(data.message);
      }
    },
  });
}

function exitGroup(groupId, callback) {
  $.ajax({
    url: '/api/group/exitGroup',
    type: 'post',
    data: { groupId: groupId },
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        callback();
      } else {
        tip(data.message);
      }
    },
  });
}

function getStrlen(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127 || str.charCodeAt(i) == 94) {
      len += 2;
    } else {
      len++;
    }
  }
  return len;
}

function getGroupMembers(params, callback) {
  $.ajax({
    url: '/api/group/getGroupMembers',
    type: 'post',
    data: params,
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        callback(data.result);
      } else {
        tip(data.message);
      }
    },
  });
}

function showMap() {
  var map = new BMap.Map('map');
  map.addControl(new BMap.GeolocationControl());
  var position = lm.getCookie('position');
  position = position ? JSON.parse(position) : { latitude: 39.915, longitude: 116.404 };
  console.log(position);
  var point = new BMap.Point(position.longitude, position.latitude);
  var gc = new BMap.Geocoder();
  gc.getLocation(point, function (rs) {
    var addComp = rs.addressComponents;
    province = addComp.province;
    city = addComp.city;
    district = addComp.district;
    street = addComp.street;
    var marker = new BMap.Marker(point); //地图事件类
    var opts = {
      width: 25, // 信息窗口宽度
      height: 120, // 信息窗口高度
      title: '我所在的地点:<hr />', // 信息窗口标题 ，这里声明下，可以在自己输出的信息里面嵌入html标签的
    };
    var infoWindow = new BMap.InfoWindow(
      '省份:' + province + ';' + '城市:' + city + ';<br /><br />' + '县/区:' + district + ';' + '街道:' + street + '.',
      opts
    );
    // 创建信息窗口对象，把信息在初始化 地图信息窗口类的同时写进去

    marker.enableDragging(); //启用拖拽事件
    marker.addEventListener('dragend', function (e) {
      gc.getLocation(point, function (rs) {
        //由于在getLocation函数返回信息之前，首先执行它下面的代码的，所以要把重新拖动后的代码放到它里面
        var addComp = rs.addressComponents;
        province = addComp.province; //获取省份
        city = addComp.city; //获取城市
        district = addComp.district; //区
        street = addComp.street; //街
        opts = {
          width: 25, // 信息窗口宽度
          height: 160, // 信息窗口高度
          title: '现在的位置:<hr />', // 信息窗口标题
        };
        point = new BMap.Point(e.point.lng, e.point.lat); //标记新坐标（拖拽以后的坐标）
        marker = new BMap.Marker(point); //事件类

        infoWindow = new BMap.InfoWindow(
          '省份:' +
            province +
            ';' +
            '城市:' +
            city +
            ';<br /><br />' +
            '县/区:' +
            district +
            ';' +
            '街道:' +
            street +
            '.<br />' +
            '经度：' +
            e.point.lng +
            '<br />纬度：' +
            e.point.lat,
          opts
        );

        map.openInfoWindow(infoWindow, point);
        //这条函数openInfoWindow是输出信息函数，传入信息类和点坐标
      });
    });
  });
  map.centerAndZoom(point, 15);
}
