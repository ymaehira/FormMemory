
// すべてのリクエストをインターセプトし、記録中且つ、記録対象のドメインであれば、フォーム内容の記録を実施
// 記録するタイミング (タブのURLが target.com/sample のときの入力内容記録) ※ iframe内のフォームにはアクセスできないっぽい
//   [リクエストドメイン]	[タブドメイン]	[記録]	[記録パス]
//   target.com			target.com		する	target.com/sample
//   other.com			target.com		する	target.com/sample
//   XHR target.com		target.com		する	target.com/sample
//   XHR other.com		target.com		する	target.com/sample
//   iframe target.com		target.com		しない	-
//   iframe other.com		target.com		しない	-
//   すべて			other.com		しない	-
//   すべて			アクティブタブ無し	しない	-
chrome.webRequest.onBeforeRequest.addListener(function(details){

  var request_domain = details.url.split('/')[2];

  // 記録対象のドメインであれば、バッヂを更新 (記録対象じゃないドメインから、記録対象ドメインに遷移した際の対応)
  // 記録対象のドメインじゃなくても、アドレスバーのドメインが記録対象であれば、フォーム内容を記録する
  if (isRecordTargetDomain(request_domain)) {enableBadge();}

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // アクティブなタブがない状態でどこかで自動でリクエストが送信された場合、なにもせずリターン (この処理必要ないかも？？
    if (tabs[0] == undefined) {return false;}

    var tab_domain = tabs[0].url.split('/')[2];

    // 記録対象のドメインでなければなにもせずにリターン
    if (!isRecordTargetDomain(tab_domain)) {return false;}

    // 送信されたリクエストが、記録対象ドメインを表示中のタブからの送信でない場合は、なにもせずリターン
    if (tabs[0].id != details.tabId) {return false;}

    // 画像、JS、CSS、フラッシュ へのリクエストは除外 ("main_frame" と "xmlhttprequest" と "sub_frame" のみに置き換えてもよさそう)
    if (details.type == 'script' || details.type == 'image' || details.type == 'stylesheet' || details.type == 'other') {return false;}

    // 画面遷移したタイミングで、キーバインド操作で インクリメント/デクリメント した履歴移動データをクリアする
    if (details.type == 'main_frame' || details.type == 'sub_frame') {
      localStorage.removeItem("historyNum");
    }

    // 表示している画面上の入力情報を取得し、localStorage に保存
    chrome.tabs.sendMessage(tabs[0].id, {method: 'getInputData'}, function(response) {
      if (typeof response === 'undefined') {return false;}

      var data_set = getDomainDataSet(tab_domain);

      // リダイレクトの際に2回同じデータが登録されないように対応
      if (data_set['lastRequestId'] == details.requestId) {return false;}

      var url = tabs[0].url.split('?')[0];
      var records = [];
      if (!isNull(data_set[url])) {
        records = data_set[url];
      }

      // 余計な履歴が増えるのを避けるため、空の場合はなにもせずリターン
      if (Object.keys(response).length == 0) {return false;}

      /////////////////////////////////////////////////// 未実装 //////////////////////////////////////////////////
      ////////////////////////////////////////1つまえの履歴とまったく同じデータの場合、記録しないようにする///////////////////////////////////

      // フォーム入力内容をセットする。上限は 30 回分
      var record = {date: new Date(), formData: response}
      records.unshift(record);
      records = records.slice(0, 30);

      data_set[url] = records;
      data_set['lastRequestId'] = details.requestId;
      data_set['lastModified'] = new Date();
      setDomainDataSet(tab_domain, data_set);
    });
  });
}, { urls: [ "*://*/*" ] }, ["blocking"]);


// タブを切り替えたとき、記録対象のドメインであればバッヂをセットし、そうでなければバッヂを解除
chrome.tabs.onActivated.addListener(function(activeInfo){
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    var tabDomain = tab.url.split('/')[2]
    var recordingDomains = getRecordingDomains();

    if (recordingDomains.indexOf(tabDomain) >= 0) {
      enableBadge();
    } else {
      disableBadge();
    }
  });
});

function enableBadge() {
  chrome.browserAction.setBadgeText({text: "ON"});
  chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
}

function disableBadge() {
  chrome.browserAction.setBadgeText({text: ""});
}


// 記録対象のドメインを追加
function addRecord(domain) {
  return addRecordTargetDomain(domain);
}

// 記録対象からドメインを削除
function removeRecord(domain) {
  return removeRecordTargetDomain(domain);
}

// 記録中の状態を切り替え
//function toggleRecord(target_domain) {
//  if (isRecording()) {
//    clearRecordTargetDomains();
//    chrome.browserAction.setBadgeText({text: ""});
//    return;
//  }
//
//  addRecordTargetDomain(target_domain);
//  chrome.browserAction.setBadgeText({text: "ON"});
//  chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
//}

function getRecordingDomains() {
  var recordTargetDomains = localStorage.getItem('recordTargetDomains');
  if (isNull(recordTargetDomains)) {return [];}
  return JSON.parse(recordTargetDomains);
}

function isRecordTargetDomain(domain) {
  var recordTargetDomains = localStorage.getItem('recordTargetDomains');
  if (isNull(recordTargetDomains)) {return false;}
  recordTargetDomains = JSON.parse(recordTargetDomains);
  return recordTargetDomains.indexOf(domain) >= 0;
}

function addRecordTargetDomain(domain) {
  var recordTargetDomains = localStorage.getItem('recordTargetDomains');
  if (isNull(recordTargetDomains)) {
    recordTargetDomains = [];
  } else {
    recordTargetDomains = JSON.parse(recordTargetDomains);
  }
  if (recordTargetDomains.indexOf(domain) < 0) {
    recordTargetDomains.push(domain);
    localStorage.setItem("recordTargetDomains", JSON.stringify(recordTargetDomains));
  }
  return recordTargetDomains;
}

function removeRecordTargetDomain(domain) {
  var recordTargetDomains = localStorage.getItem('recordTargetDomains');
  if (isNull(recordTargetDomains)) {
    recordTargetDomains = [];
  } else {
    recordTargetDomains = JSON.parse(recordTargetDomains);
  }

  var index = recordTargetDomains.indexOf(domain);
  if (index >= 0) {recordTargetDomains.splice(index, 1);}
  localStorage.setItem("recordTargetDomains", JSON.stringify(recordTargetDomains));
  return recordTargetDomains;
}

function clearRecordTargetDomains() {
  localStorage.removeItem("recordTargetDomains");
}

function setDomainDataSet(domain, data_set) {
  var saved_domains = localStorage.getItem('savedDomains');
  if (isNull(saved_domains)) {
    saved_domains = [];
  } else {
    saved_domains = JSON.parse(saved_domains);
  }
  if (saved_domains.indexOf(domain) < 0) {saved_domains.push(domain)}
  localStorage.setItem('savedDomains', JSON.stringify(saved_domains));
  localStorage.setItem(domain, JSON.stringify(data_set));
  return true;
}

function removeDomainDataSet(domain) {
  var saved_domains = localStorage.getItem('savedDomains');
  if (isNull(saved_domains)) {
    saved_domains = [];
  } else {
    saved_domains = JSON.parse(saved_domains);
  }
  var index = saved_domains.indexOf(domain);
  if (index >= 0) {saved_domains.splice(index, 1)}
  localStorage.setItem('savedDomains', JSON.stringify(saved_domains));
  localStorage.removeItem(domain);
}

function getDomainDataSet(domain) {
  var data_set = localStorage.getItem(domain);
  if (isNull(data_set)) {
    data_set = {};
  } else {
    data_set = JSON.parse(data_set);
  }

  return data_set;
}

function getRecords(domain, url) {
  var data_set = localStorage.getItem(domain);
  if (isNull(data_set)) {
    data_set = {};
  } else {
    data_set = JSON.parse(data_set);
  }

  if (isNull(data_set)) {return [];}
  var records = data_set[url];
  if (isNull(records)) {return [];}
  return records;
}


function getAllDomainData() {
  var savedDomains = localStorage.getItem('savedDomains');
  if (isNull(savedDomains)) {
    savedDomains = [];
  } else {
    savedDomains = JSON.parse(savedDomains);
  }

  var res = {savedDomains: savedDomains};
  for (var i = 0; i < savedDomains.length; i++) {
    res[savedDomains[i]] = getDomainDataSet(savedDomains[i]);
  }

  return res;
}

//function addDomainData(domainData) {
//  var domainData = JSON.parse(domainData);
//
//  for (var i = 0; i < domainData['savedDomains'].length; i++) {
//    setDomainDataSet(domainData['savedDomains'][i], domainData[domainData['savedDomains'][i]]);
//  }
//}

function garbageCollect() {
  var saved_domains = localStorage.getItem('savedDomains');
  if (isNull(saved_domains)) {
    saved_domains = [];
  } else {
    saved_domains = JSON.parse(saved_domains);
  }

  if (saved_domains.length < 30) {return;}

  var delete_target = {data_set: getDomainDataSet(saved_domains[0]), domain: saved_domains[0]};

  for(var i = 1; i < saved_domains.length; i++){
    var data_set = getDomainDataSet(saved_domains[i]);
    var data_set_time = new Date(data_set['lastModified']);
    var delete_target_time = new Date(delete_target['data_set']['lastModified']);
    if (data_set_time.getTime() < delete_target_time.getTime()) {
      delete_target = {data_set: data_set, domain: saved_domains[i]};
    }
  }

  removeDomainDataSet(delete_target['domain']);

}

function isNull(str) {
  if (str == undefined || str == null || str == "") {
    return true;
  } else {
    return false;
  }
}

function formatDate(date) {
  var format = 'YYYY-MM-DD hh:mm:ss.SSS';
  format = format.replace(/YYYY/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  if (format.match(/S/g)) {
    var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
    var length = format.match(/S/g).length;
    for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
  }
  return format;
};


// キーバインドから要求された履歴データをフォームにセットする
function setFormDataFromHistory(command) {
  var historyNum = localStorage.getItem("historyNum") || 0;

  // 現在アクティブなタブのドメインの履歴データがあるかを確認
  // 存在する履歴データのサイズを超えないようにする
  /////////////////////////////////////////////////// 未実装 //////////////////////////////////////////////////
  
  var data = {xxx:[]};
  var max = data.xxx.length;

  switch (command) {
    case 'historyBack':
      historyNum > 0 ? historyNum-- : null;
      break;
    case 'historyForward':
      historyNum < max ? historyNum++ : null;
      break;
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {method: 'setData', data: data.xxx[historyNum]},
      function(response) {}
    );
  });
}

// キーバインド設定
chrome.commands.onCommand.addListener(function(command) {
 switch (command) {
    case 'historyBack': setFormDataFromHistory(command); break;
    case 'historyForward': setFormDataFromHistory(command); break;
  }
});
