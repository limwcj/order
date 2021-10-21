/**
 * Created by wangchengjie on 2018/7/20.
 */
'use strict';

init();

window.getUser = function (callback) {
  $.ajax({
    url: '/api/user/getUser',
    type: 'post',
    dataType: 'json',
    async: false,
    success: function (data) {
      if (data.code == 0) {
        callback(data.result);
      } else {
        tip(data.message);
      }
    },
  });
};

window.getUserGroup = function (params, callback) {
  $.ajax({
    url: '/api/group/getUserGroup',
    type: 'post',
    data: params,
    dataType: 'json',
    async: false,
    success: function (data) {
      if (data.code == 0) {
        callback(data.result);
      } else {
        tip(data.message);
      }
    },
  });
};

window.tip = function (str, bool, callback) {
  if (typeof bool == 'function') callback = bool;
  var $tip = $('#dialog-tip');
  if ($tip.length)
    return $tip.slideUp(() => {
      $tip.remove();
      _buildTip(str, bool);
    });
  _buildTip(str, bool);
  function _buildTip(str, bool) {
    $(`<div id="dialog-tip" class="${bool ? 'tip-success' : 'tip-error'}"><span>${lm.htmlEncode(str)}</span></div>`)
      .appendTo($('body'))
      .slideDown(function () {
        var $this = $(this);
        setTimeout(() => {
          $this.slideUp(
            () => {
              $this.remove();
            },
            () => {
              if (callback) callback();
            }
          );
        }, 2000);
      });
  }
};

window.onload = function () {
  //safari禁止缩放
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });
  document.addEventListener('dblclick', function (e) {
    e.preventDefault();
  });
  document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  });
  var lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    function (event) {
      var now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
  history.pushState(null, null, document.URL);
  window.addEventListener('popstate', function () {
    history.pushState(null, null, document.URL);
  });
};

$.fn.animation = function (xNum, yNum, callback) {
  var offsetTop = parseInt(this.offset().top + 10);
  var offsetLeft = parseInt(this.offset().left);
  html2canvas(this[0]).then((canvas) => {
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var canvasStyleWidth = canvas.style.width.slice(0, -2);
    var canvasStyleHeight = canvas.style.height.slice(0, -2);
    var pieceWidth = canvasWidth / xNum;
    var pieceHeight = canvasHeight / yNum;
    console.log(
      `canvasWidth: ${canvasWidth},canvasHeight:${canvasHeight},pieceWidth:${pieceWidth},pieceHeight:${pieceHeight}`
    );
    var ctx = canvas.getContext('2d');
    for (var i = 0; i < xNum; i++) {
      for (var j = 0; j < yNum; j++) {
        var newX = i * pieceWidth;
        var newY = j * pieceHeight;
        var imageData = ctx.getImageData(newX, newY, pieceWidth, pieceHeight);
        var _canvas = document.createElement('canvas');
        var _ctx = _canvas.getContext('2d');
        _canvas.width = pieceWidth;
        _canvas.height = pieceHeight;
        _canvas.style.width = canvasStyleWidth / xNum + 'px';
        _canvas.style.height = canvasStyleHeight / yNum + 'px';
        _canvas.style.left = Math.floor(offsetLeft + (canvasStyleWidth / xNum) * i) + 'px';
        _canvas.style.top = Math.floor(offsetTop + (canvasStyleHeight / yNum) * j) + 'px';
        _ctx.rect(0, 0, pieceWidth, pieceHeight);
        _ctx.fill();
        _ctx.putImageData(imageData, 0, 0);
        $(_canvas).appendTo($('body')).addClass('rotate');
      }
    }
    setTimeout(function () {
      $('canvas').remove();
    }, 1000);
    if (callback) return callback();
  });
};

getUser(function (user) {
  getUserGroup({ userId: user.userId }, function (result) {
    if (result.length) {
      if (result.length == 1) {
        lm.setCookie('groupId', result[0].groupId, 60 * 60 * 1000);
        lm.setCookie('groupName', result[0].groupName, 60 * 60 * 1000);
        $('#current-status-user').html(
          `当前登录：${lm.htmlEncode(user.username)}（${lm.htmlEncode(result[0].groupName)}）`
        );
        socketInit();
      } else {
        socketInit();
        if (lm.getCookie('groupId')) {
          $('#current-status-user').html(
            `当前登录：${lm.htmlEncode(user.username)}（${lm.htmlEncode(lm.getCookie('groupName'))}）`
          );
        } else {
          $('<div id="mask">').appendTo('body').show();
          $('<div class="choose-group choose-group-title">选择饭团</div>').appendTo('body');
          var left = $('body').width() * 0.025 - 5;
          result.forEach(function (i, index) {
            var _top = 165 + 50 * index;
            $(`<div class="choose-group choose-group-li" data-groupId="${i.groupId}">`)
              .html(lm.htmlEncode(i.groupName))
              .appendTo($('body'))
              .css({ left: left + 'px' })
              .animate({ top: _top + 'px', opacity: 1 }, result.length * 100 + 100 - index * 100)
              .animate({ top: _top - 5 + 'px' }, 'fast')
              .on('click', function () {
                lm.setCookie('groupId', i.groupId, 60 * 60 * 1000);
                lm.setCookie('groupName', i.groupName, 60 * 60 * 1000);
                location.reload();
              });
          });
        }
      }
    } else {
      $('#current-status-user').html(`当前登录：${lm.htmlEncode(user.username)}（尚未加入饭团）`);
    }
  });
  lm.setCookie('userId', user.userId);
  lm.setCookie('userName', user.username);
  $('#btn-login')
    .attr('id', 'btn-logout')
    .html(`<span class="fa fa-1x fa-sign-out">&nbsp;</span><span>注销</span>`)
    .on('click', function () {
      logout();
    });
});

$('.closeDialog-btn').on('click', function () {
  location.href = 'index.html';
});

$('.block')
  .not('#btn-login,#btn-logout')
  .on('click', function () {
    location.href = $(this).data('href') || 'index.html';
  });

$('.agree')
  .on('click', function () {
    socket
      .emit('vote', {
        foodId: $(this).attr('foodid'),
        groupId: lm.getCookie('groupId'),
        anonymity: $('.btn-anonymity .fa-check').length,
        number: $(this).attr('number'),
      })
      .on('vote', (msg) => {
        tip(msg, true);
        $('#quick-vote').hide();
        $('#vote-tool').children().hide();
      });
  })
  .next()
  .on('click', function () {
    location.href = 'vote.html?action=against';
  });

$('.btn-anonymity').on('click', function () {
  if ($('.btn-anonymity .fa-question').length) {
    $('.btn-anonymity .fa-question')
      .addClass('fa-check')
      .removeClass('fa-question')
      .parent()
      .css({ background: '#CCFFCC', color: '#33CC66' });
  } else {
    $('.btn-anonymity .fa-check')
      .addClass('fa-question')
      .removeClass('fa-check')
      .parent()
      .css({ background: '#fff', color: '#666' });
  }
});

function init() {
  var csrfToken = lm.getCookie('csrfToken');
  if (!csrfToken) location.reload();

  function csrfSafeMethod(method) {
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
  }
  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader('x-csrf-token', csrfToken);
      }
    },
    statusCode: {
      401: function () {
        $('#btn-login').click();
      },
    },
  });

  lm.login.init({
    loginBtn: 'btn-login',
    cookieValidSeconds: 7 * 24 * 3600,
    loginCallback: function () {
      location.reload();
    },
    registerCallback: function () {
      location.reload();
    },
  });

  // getLocation();

  console.log(
    `welcome to confused ordering system！
  
《饭团》
不用为每天吃什么而纠结
加入或创建一个饭团
添加自己喜爱的食物
与小伙伴一起用自己喜欢的方式
告别纠结
走向人生巅峰`
  );
}

function logout() {
  $.ajax({
    url: '/api/user/logout',
    type: 'post',
    dataType: 'json',
    success: function (data) {
      if (data.code == 0) {
        lm.delCookie('userId');
        lm.delCookie('userName');
        lm.delCookie('groupId');
        lm.delCookie('groupName');
        location.replace(location.href);
      } else {
        tip(data.message);
      }
    },
  });
}

function socketInit() {
  var room = lm.getCookie('groupId');
  if (!room) return;
  window.socket = io('/', { query: { room: room }, transports: ['websocket'] });
  socket
    .on('err', (msg) => {
      tip(msg);
    })
    .on('tip', (msg) => {
      tip(msg, true);
    })
    .on('online', (msg) => {
      tip(`${msg} 上线了`, true);
    })
    .on('offline', (msg) => {
      tip(`${msg} 下线了`, true);
    })
    .emit('onlineCount', room)
    .on('onlineCount', (msg) => {
      if (msg) {
        $('#online span').html(msg);
      }
    })
    .emit('voteStatus', { groupId: room })
    .on('voteStatus', (msg) => {
      var $voteStatus = $('#current-vote-status').hide();
      var $quickVote = $('#quick-vote').hide();
      if (msg.length) {
        $voteStatus.show();
        var $eq0 = $voteStatus.find('div').eq(0).css('color', '#FFFF00'); //  投票状态
        var $eq1 = $voteStatus.find('div').eq(1).css('color', '#FFFF00'); //  当前投票店铺名称
        $quickVote
          .children()
          .attr('foodid', msg[msg.length - 1].foodId || msg[msg.length - 1].newFoodId)
          .attr('number', msg[0].number);
        var foodName = msg[msg.length - 1].foodName;
        var againstIndex = _findAgainstIndex(msg, lm.getCookie('userId'));
        var voteNumber = msg.slice(againstIndex).length;
        if (voteNumber == msg[msg.length - 1].number) {
          $eq0.text(`投票结束`).css('color', 'red');
          $eq1.text(foodName).css('color', 'red');
        }
        $eq0.show();
        if (!$eq1.is(':hidden')) {
          if (foodName != $eq1.text())
            $eq1.slideUp(() => {
              $eq1.text(foodName).slideDown();
            });
        } else {
          $eq1.text(foodName).slideDown();
        }
        $eq0.find('span').text(`（${voteNumber}/${msg[0].number}）`);
        if (!_hasVote(msg, lm.getCookie('userId'))) {
          $quickVote.show();
        }
      }
    })
    .on('voteEnd', (msg) => {
      tip(msg, true, () => {
        socket.emit('voteStatus', { groupId: lm.getCookie('groupId') });
      });
    });
}

function _findAgainstIndex(voteList) {
  for (let i = voteList.length - 1; i >= 0; i--) {
    if (voteList[i].newFoodId) return i;
  }
  return 0;
}

function _hasVote(voteList, userId) {
  let againstIndex = _findAgainstIndex(voteList);
  for (let i = againstIndex; i < voteList.length; i++) {
    if (voteList[i].userId == userId) return true;
  }
  return false;
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    tip('当前浏览器不支持地理定位');
  }
}

function showPosition(position) {
  if (position) {
    var _position = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    lm.setCookie('position', JSON.stringify(_position));
  }
}

function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      if (!lm.getCookie('PERMISSION_DENIED')) {
        tip('开启地理定位可获得更好服务');
        lm.setCookie('PERMISSION_DENIED', 'PERMISSION_DENIED', 600 * 1000);
      }
      break;
    case error.POSITION_UNAVAILABLE:
      tip('无法获取地理位置');
      break;
    case error.TIMEOUT:
      tip('获取地理位置超时');
      break;
    case error.UNKNOWN_ERROR:
      tip('获取地理位置异常');
      break;
  }
}
