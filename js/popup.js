
// ポップアップを開いたときに、記録エリアを描画する
$(function(){
  drawRecordStatusView();
});

// 「開始」ボタンをクリックしたときに、テキストボックスに指定されたドメインのフォーム入力データの記録を開始
function startRecord() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var BG = chrome.extension.getBackgroundPage();
    var target_domain = $('#targetDomain').val();
    if (target_domain != null && target_domain != '') {
      var recordTargetDomains = BG.addRecord(target_domain);
      drawRecordStatusView();
      if (recordTargetDomains.indexOf(tabs[0].url.split('/')[2]) >= 0) {
        chrome.browserAction.setBadgeText({text: "ON"});
        chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
      }
    }
  });
}

// 「停止」ボタンをクリックしたときに、対象のドメインのフォーム入力データの記録を停止
function stopRecord(param) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var BG = chrome.extension.getBackgroundPage();
    var recordTargetDomains = BG.removeRecord(param['data']['domain']);
    drawRecordStatusView();
    if (recordTargetDomains.indexOf(tabs[0].url.split('/')[2]) < 0) {
      chrome.browserAction.setBadgeText({text: ""});
    }
  });
}

function drawRecordStatusView() {
  var BG = chrome.extension.getBackgroundPage();
  var recordingDomains = BG.getRecordingDomains();
  $('#recordStatusView').empty();
  
  if (recordingDomains.length == 0) {
    drawNewRecordForm();
    return;
  }
  
  for (var i=0; i < recordingDomains.length; i++) {
    var div = $('<div>');
    var button =  $('<input>').attr('type', 'button').click({domain: recordingDomains[i]}, stopRecord).val('記録を停止').attr('class', 'button-stop');
    var input = $('<input>').attr('type', 'text').val(recordingDomains[i]).attr('disabled', 'disabled').attr('style', 'padding: 0px; vertical-align: middle;');
    var message = $('<span>').text('記録中...').attr('style', 'margin-left: 10px;');
    
    if (i == 0) {
      var newButton = $('<a>').attr('href', '').click(drawNewRecordForm).text('記録対象のドメインを追加').attr('class', 'not-link').attr('style', 'margin-left: 30px;');
      div.append(button).append(input).append(message).append(newButton);
    } else {
      div.append(button).append(input).append(message);
    }
    
    $('#recordStatusView').append(div);
  }

}

function drawNewRecordForm() {
  if (document.getElementById("newRecordForm") != null) {return false;}
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var div = $('<div>').attr('id', 'newRecordForm');
    var button =  $('<input>').attr('type', 'button').attr('id', 'recordButton').val('記録を開始').attr('class', 'button-start').click(startRecord);
    var input = $('<input>').attr('type', 'text').attr('id', 'targetDomain').attr('placeholder', 'example.com').attr('style', 'padding: 0px; vertical-align: middle;');
    
    var BG = chrome.extension.getBackgroundPage();
    var tab_domain = tabs[0].url.split('/')[2];
    var recordTargetDomains = BG.getRecordingDomains();
    if (recordTargetDomains.indexOf(tab_domain) < 0) {
      input.val(tab_domain);
    }
    
    var message = $('<div>').text('以下に指定されたドメインを対象に、フォームに入力されたデータを記録します').attr('style', 'margin-top: 10px;');
    div.append(message).append(button).append(input);
    $('#recordStatusView').append(div);
  });
  
  return false;
}

// POSTデータをJSONに変換して、テキストエリアに入れる
$(function(){
  $('#convertToJson').click(function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {method: 'convertToJson', data: $('#postData').val(), codeType: $('#codeType').val()},
        function(response) {
          $('#formData').remove();
          var textarea = '<textarea id="formData" style="width: 500px; height: 200px;">' + response + '</textarea>';
          $('#formDataParent').append(textarea);
        }
      );
    });
  });
});

// テキストボックスに入力されたデータを、アクティブWindowのアクティブタブの content-script に送信
$(function(){
  $('#setData').click(function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {method: 'setData', data: $('#formData').val()},
        function(response) {}
      );
    });
  });
});

// フォームの入力履歴をセット
$(function(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var BG = chrome.extension.getBackgroundPage();
    var records = BG.getRecords(tabs[0].url.split('/')[2], tabs[0].url.split('?')[0]);
    for(var i = 0; i < records.length; i++){
      var date = BG.formatDate(new Date(records[i]['date']));
      var option = $('<option>').html(date).val(i);
      if (i == 0) {option.attr('selected', 'selected');}
      $('#formHistory').append(option);
    }
    $('#formData').text(JSON.stringify(records[0]['formData'], null , " "));
  });
});

// 選択したフォーム履歴をテキストエリアにセットする
$(function(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    $("#formHistory").change(function () {
      var BG = chrome.extension.getBackgroundPage();
      var records = BG.getRecords(tabs[0].url.split('/')[2], tabs[0].url.split('?')[0]);
      
      $("#formHistory option:selected").each(function () {
        var record = records[parseInt($(this).val())]
        if (record != null && record['formData'] != null) {
          $('#formData').remove();
          var textarea = '<textarea id="formData" style="width: 500px; height: 200px;">' + JSON.stringify(record['formData'], null , " ") + '</textarea>';
          $('#formDataParent').append(textarea);
        } else {
          $('#formData').text('');
        }
      });
    });
  });
});


// ユーザが入力したデータを取得
$(function(){
  $('#getData').click(function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {method: 'getInputData'}, function(response) {
        $('#formData').remove();
        var textarea = '<textarea id="formData" style="width: 500px; height: 200px;">' + JSON.stringify(response, null , " ") + '</textarea>';
        $('#formDataParent').append(textarea);
      });
    });
  });
});


// 保存しているデータが大きくなりすぎないように、保存ドメイン数が最大値に達したら、一番古いドメインデータを削除する
$(function(){
  var BG = chrome.extension.getBackgroundPage();
  BG.garbageCollect();
});


// ローカルストレージをクリア
$(function(){
  $('#clearRecord').click(function(){
    localStorage.setItem("data", null);
    localStorage.removeItem("data");
    localStorage.clear();
  });
});


// キーバインド設定
// こんな感じで拡張のショートカットキー設定する http://www.teradas.net/archives/14605/
//$(function(){
//  $('html').keydown(function(e){
//    keycode = e.which;
//    ctrl = typeof e.modifiers == 'undefined' ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
//    shift = typeof e.modifiers == 'undefined' ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
    //e.preventDefault();
    //e.stopPropagation();
//    keychar = String.fromCharCode(keycode).toUpperCase();
//    if (ctrl) {
//      switch(keychar){
//        case 'F': alert("F");break;
//        case 'B': alert("B");break;
//      }
//    }
//  });
//});
