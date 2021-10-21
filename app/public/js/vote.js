/**
 * Created by wangchengjie on 2018/8/3.
 */
'use strict';
const userId = lm.getCookie('userId');
const groupId = lm.getCookie('groupId');
const action = lm.getQueryString('action');

if (groupId) {
  $(
    `<div class="dialog-mygroup-title"><span>${lm.htmlEncode(
      lm.getCookie('groupName')
    )}</span> <span class="fa fa-plus-circle" onclick="newVote(${groupId})"></span></span></div>`
  ).prependTo($('.dialog'));
  socket.on('voteStatus', (msg) => {
    var $voteTool = $('#vote-tool');
    var $eatNum = $voteTool.find($('.eat-num'));
    var $anonymity = $voteTool.find($('.btn-anonymity'));
    var $agree = $voteTool.find($('.agree'));
    var $against = $voteTool.find($('.against'));
    var _left = $('body').width() * 0.05;
    $voteTool.children().hide();
    $('#foods').hide().empty();
    $('#vote-now,#vote-history').hide();
    if (msg.length == 0) $('#vote-history').empty();
    getFood({ groupId: groupId }, function (result) {
      if (!msg.length) {
        //开始投票
        if (!result.length) return tip('餐库空空如也');
        getGroupMembers({ groupId: groupId }, function (data) {
          let len = data.length;
          $anonymity.show();
          $eatNum.show().find('span').text(len).parent().siblings('input').attr('max', len).val(len);
          result.forEach(function (i, index) {
            $(buildFoodCard(i.foodId, i.creator, i.location, new Date(i.createDate), i.foodName))
              .appendTo($('#foods').show())
              .css({ left: '-500px' })
              .animate(
                {
                  left: _left + 10 + 'px',
                  opacity: 1,
                },
                (500 / result.length) * (index + 1)
              )
              .animate({ left: _left + 'px' }, 'fast');
          });
          $('#vote-tool')
            .children('div:visible')
            .eq(0)
            .not('.reset-vote')
            .css('marginLeft', _left + 'px');
        });
      } else {
        //投票中
        var lastFood = msg[msg.length - 1];
        var lastFoodInfo = {};
        var voteNumber = msg.slice(_findAgainstIndex(msg, userId)).length;
        $agree.attr('foodid', lastFood.foodId || lastFood.newFoodId).attr('number', lastFood.number);
        $against.attr('foodid', lastFood.foodId || lastFood.newFoodId).attr('number', lastFood.number);
        if (action == 'against') {
          //反对并重新投票
          if (_hasVote(msg, userId)) return (location.href = 'vote.html');
          $anonymity.show();
          var _index = 0;
          result.forEach(function (i, index) {
            if (lastFood.foodId == i.foodId || lastFood.newFoodId == i.foodId) lastFoodInfo = i;
            var _exist = false;
            for (var j = 0; j < msg.length; j++) {
              if (msg[j].foodId == i.foodId || msg[j].newFoodId == i.foodId) {
                _exist = true;
                break;
              }
            }
            if (!_exist) {
              //去掉已经投票过的选项
              _index++;
              $(buildFoodCard(i.foodId, i.creator, i.location, new Date(i.createDate), i.foodName))
                .appendTo($('#foods').show())
                .css({ left: '-500px' })
                .animate(
                  {
                    left: _left + 10 + 'px',
                    opacity: 1,
                  },
                  (500 / result.length) * (index + 1)
                )
                .animate({ left: _left + 'px' }, 'fast');
            }
          });
          if (!_index) {
            //没有店铺可供投票，被全部否定
            tip('反对无效！兄嘚，没得吃啦');
            $(
              buildFoodCard(
                lastFoodInfo.foodId || lastFoodInfo.newFoodId,
                lastFoodInfo.creator,
                lastFoodInfo.location,
                new Date(lastFoodInfo.createDate),
                lastFoodInfo.foodName
              )
            )
              .appendTo($('#foods').show())
              .css({ left: '-500px' })
              .animate(
                {
                  left: _left + 10 + 'px',
                  opacity: 1,
                },
                500 / result.length
              )
              .animate({ left: _left + 'px' }, 'fast');
          } else {
            tip('反对者可重新选择,但不能与之前重复', true);
          }
        } else {
          showVoteHistory(msg);
          //投票按钮
          if (!_hasVote(msg, userId)) {
            $agree.show();
            $anonymity.show();
            var votedFood = {};
            msg.forEach((i) => {
              votedFood[i.foodId || i.newFoodId] = 1;
            });
            if (Object.keys(votedFood).length < result.length) $against.show(); //没店铺可选时隐藏反对按钮
          }
          //投票公示栏
          var $voteNow = $('#vote-now');
          $voteNow.show().find('span').text(lastFood.foodName);
          if (voteNumber == lastFood.number) {
            //投票结束
            $voteNow.css('color', 'red');
            $('.dialog-mygroup-title span').last().show();
          }
          //投票进度
          var $voteProgress = $('#vote-now-progress').find('div');
          var voteNowWidth = $voteNow.width();
          var voteProgressWidth = (voteNumber / lastFood.number) * voteNowWidth;
          $voteProgress.animate({ width: voteProgressWidth + 'px' });
        }
      }
      $('#vote-tool')
        .children('div:visible')
        .eq(0)
        .not('.reset-vote')
        .css('marginLeft', _left + 'px');
    });
  });
}

$('.dialog-mygroup-title span:first-child').on('click', function () {
  //切换饭团
  lm.delCookie('groupId');
  lm.delCookie('groupName');
  location.reload();
});

$('.eat-num input').on('input propertychange', function () {
  //投票人数设定
  $(this).siblings('label').find('span').text($(this).val());
});

$('#vote-now')
  .find('span')
  .eq(0)
  .on('click', function () {
    //团长取消投票特权
    getGroupMembers({ groupId: groupId }, function (data) {
      if (data) {
        var isManager = false;
        data.forEach((i) => {
          if (userId == i.userId && i.position == 1) isManager = true;
        });
        if (isManager && confirm('团长特权：\r确定关闭本次投票并重新开始吗'))
          return socket.emit('voteEnd', { groupId: groupId, force: true });
      }
    });
  });

function showVoteHistory(msg) {
  var len = $('.vote-history-li').length;
  var newMsg = msg.slice(len);
  newMsg.forEach((voteInfo, index) => {
    $(`<div class="vote-history-li">
          <span>${lm.htmlEncode(voteInfo.anonymity ? '匿名用户' : voteInfo.username)}</span> 
          <span class="vote-history-li-against" style="color: ${voteInfo.foodId ? 'green' : 'red'}">${
      voteInfo.foodId ? '赞同了' : '重新提议了'
    }</span> 
          <span>${lm.htmlEncode(voteInfo.foodName)}</span><span>${lm.date.formatDate(
      new Date(voteInfo.createDate),
      'hh:mm'
    )}</span><div class="triangle-right"></div>
      </div>`)
      .prependTo($('#vote-history').show())
      .fadeIn(100 * index);
  });
}

function newVote(groupId) {
  socket.emit('voteEnd', { groupId: groupId });
}

function buildFoodCard(foodId, userName, location, date, foodName) {
  return `<div class="food-li" data-foodid="${foodId}" onclick="vote(${foodId})">
      <div><span>${lm.htmlEncode(userName)}</span>
      <span>${lm.htmlEncode(location)}</span>
      <span>${lm.htmlEncode(lm.date.formatDate(date, 'yyyy-MM-dd'))}</span></div>
      <div class="food-li-name"><span>${lm.htmlEncode(foodName)}</span></div>
  </div>`;
}

function getFood(params, callback) {
  $.ajax({
    url: '/api/food/getFood',
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

function vote(foodId) {
  socket.emit('vote', {
    foodId: foodId,
    groupId: groupId,
    anonymity: $('.btn-anonymity .fa-check').length,
    number: $('.eat-num input').val(),
  });
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

console.log(window.position);
