
$(function(){
  var savedDomains = localStorage.getItem('savedDomains');
  if (savedDomains == null ) {
    savedDomains = [];
  } else {
    savedDomains = JSON.parse(savedDomains);
  }
  
  for (var i = 0; i < savedDomains.length; i++) {
    var div = $('<div>');
    var checkbox = $('<input>').attr('type', 'checkbox').val(savedDomains[i]);
    var description = $('<span>').text(savedDomains[i]);
    div.append(checkbox);
    div.append(description);
    $('#exportTargetDomains').append(div);
  }

});


// インポート実行
$(function(){
  $('#doImport').click(function(){
    $('#importMessage').empty();
    var BG = chrome.extension.getBackgroundPage();
    impDatas = JSON.parse($('#importText').val());
    if (impDatas instanceof Array) {
      for (var i=0; impDatas.length > i; i++) {
        if (BG.setDomainDataSet(impDatas[i].domain, impDatas[i].dataSet) == true) {
          var msg = $('<div>');
          msg.text(impDatas[i].domain + ' のインポート完了.');
          $('#importMessage').append(msg);
        }
      }
    } else {
      if (BG.setDomainDataSet(impDatas.domain, impData.dataSet)) {
        $('#importArea').append(impDatas.domain + ' のインポート完了.');
      }
    }
  });
});


// エクスポート実行
$(function(){
  $('#doExport').click(function(){
    var expDatas = [];
    var BG = chrome.extension.getBackgroundPage();
    $('#exportTargetDomains :checkbox:checked').each(function() {
      expDatas.push({domain: $(this).val(), dataSet: BG.getDomainDataSet($(this).val())});
    });
    $('#exportText').val(JSON.stringify(expDatas));
  });
});

// ローカルストレージをクリア
$(function(){
  $('#clearRecord').click(function(){
    localStorage.setItem("data", null);
    localStorage.removeItem("data");
    localStorage.clear();
  });
});

$(function(){
  var size = 0;
  for(var i = 0; i < localStorage.length; i++){
    var k = localStorage.key(i);
    size += getByte(localStorage.getItem(k));
  }
  $('#displayDataSize').text(size/(1024*1024) + ' MB');
});

function getByte(text) {
  var count = 0;
  for (var i=0; i<text.length; i++) {
    var n = escape(text.charAt(i));
    if (n.length < 4) count++; else count+=2;
  }
  return count;
}