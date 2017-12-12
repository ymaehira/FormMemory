// background や popup からのメッセージの受信
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == undefined) {return};
    
    switch (request.method) {
      case 'setData': setData(request.data); break;
      case 'getInputData': sendResponse(getInputData()); break;
      case 'convertToJson': sendResponse(convertToJson(request.data, request.codeType)); break;
    }
  }
);


// イベントハンドラの発火も考慮
// テストサイト http://192.168.13.50/maehira/form_test/text.html
function setData(json_string) {
  var res = setData2(json_string);

  for (var i=0; top.frames.length > i; i++) {
    setDataToBody(json_string, top.frames[i].document.body);
  }
}

function setData2(json_string) {
  if (json_string == null || json_string == "") {return};
  
  var data = JSON.parse(json_string);
  var arrayCheckRegexp = /\[\]$/;
  
  $("input[type='text'],input[type='password'],textarea,select").each(function(i, obj) {
    if (data[$(this).attr('name')] == undefined) {return;} // nextと同等
    
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      $(this).val(data[$(this).attr('name')]);
    } else {
      $(this).val(data[$(this).attr('name')].shift());
    }
    
  });
  
  $("input[type='radio']").each(function(i, obj) {
    if (data[$(this).attr('name')] == undefined) {return;} // nextと同等
    
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      if (data[$(this).attr('name')] == $(this).val()) {
        if (!$(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", 'checked');
      } else {
        $(this).prop("checked", false);
      }
    } else {
      var dataVal = data[$(this).attr('name')].shift();
      if (dataVal == $(this).val()) {
        if (!$(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", 'checked');
      } else {
        $(this).prop("checked", false);
      }
    }
  });

  $("input[type='checkbox']").each(function(i, obj) {
    if (data[$(this).attr('name')] != undefined) {
      if ($(this).attr('name').match(arrayCheckRegexp) == null) {
        if (data[$(this).attr('name')] != $(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", data[$(this).attr('name')] ? 'checked' : false);
      } else {
        var checkStatus = data[$(this).attr('name')].shift();
        if (checkStatus != $(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", checkStatus ? 'checked' : false);
      }
    }
  });
};

function setDataToBody(json_string, body) {
  if (json_string == null || json_string == "") {return};
  
  var data = JSON.parse(json_string);
  var arrayCheckRegexp = /\[\]$/;
  
  $("input[type='text'],input[type='password'],textarea,select", body).each(function(i, obj) {
    if (data[$(this).attr('name')] == undefined) {return;} // nextと同等
    
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      $(this).val(data[$(this).attr('name')]);
    } else {
      $(this).val(data[$(this).attr('name')].shift());
    }
    
  });
  
  $("input[type='radio']", body).each(function(i, obj) {
    if (data[$(this).attr('name')] == undefined) {return;} // nextと同等
    
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      if (data[$(this).attr('name')] == $(this).val()) {
        if (!$(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", 'checked');
      } else {
        $(this).prop("checked", false);
      }
    } else {
      var dataVal = data[$(this).attr('name')].shift();
      if (dataVal == $(this).val()) {
        if (!$(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", 'checked');
      } else {
        $(this).prop("checked", false);
      }
    }
  });

  $("input[type='checkbox']", body).each(function(i, obj) {
    if (data[$(this).attr('name')] != undefined) {
      if ($(this).attr('name').match(arrayCheckRegexp) == null) {
        if (data[$(this).attr('name')] != $(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", data[$(this).attr('name')] ? 'checked' : false);
      } else {
        var checkStatus = data[$(this).attr('name')].shift();
        if (checkStatus != $(this).prop('checked')) {
          $(this).trigger('change').trigger('click');
        }
        $(this).prop("checked", checkStatus ? 'checked' : false);
      }
    }
  });
};


// param[]=1&param[]=2&... のような形式にも対応
// 同じ name で、配列形式でもないのがあったら諦める。最後に取得した値になるはず。
function getInputData() {
  let res = getInputData2()

  let body
  let frame

  for (var i=0; top.frames.length > i; i++) {
    body = ""

    try {
      frame = top.frames[i]
      body = frame.document.body
    } catch(error) {
      console.log(error)
    }

    res = Object.assign(res, getInputDataFromBody(body))
  }
  
  return res
}

function getInputData2() {
  var res = {};
  var arrayCheckRegexp = /\[\]$/;
  
  $("input[type='text'],input[type='password'],textarea,select").each(function(i, obj) {
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      res[$(this).attr('name')] = $(this).val();
    } else {
      res[$(this).attr('name')] = res[$(this).attr('name')] || [];
      res[$(this).attr('name')].push($(this).val());
    }
  });

  $("input[type='radio']:checked").each(function(i, obj) {
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      res[$(this).attr('name')] = $(this).val();
    } else {
      res[$(this).attr('name')] = res[$(this).attr('name')] || [];
      res[$(this).attr('name')].push($(this).val());
    }
  });
  
  $("input[type='checkbox']").each(function(i, obj) {
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      res[$(this).attr('name')] = $(this).prop('checked');
    } else {
      res[$(this).attr('name')] = res[$(this).attr('name')] || [];
      res[$(this).attr('name')].push($(this).prop('checked'));
    }
  });

  return res;
}

function getInputDataFromBody(body) {
  var res = {};
  var arrayCheckRegexp = /\[\]$/;
  
  $("input[type='text'],input[type='password'],textarea,select", body).each(function(i, obj) {
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      res[$(this).attr('name')] = $(this).val();
    } else {
      res[$(this).attr('name')] = res[$(this).attr('name')] || [];
      res[$(this).attr('name')].push($(this).val());
    }
  });

  $("input[type='radio']:checked", body).each(function(i, obj) {
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      res[$(this).attr('name')] = $(this).val();
    } else {
      res[$(this).attr('name')] = res[$(this).attr('name')] || [];
      res[$(this).attr('name')].push($(this).val());
    }
  });
  
  $("input[type='checkbox']", body).each(function(i, obj) {
    if ($(this).attr('name').match(arrayCheckRegexp) == null) {
      res[$(this).attr('name')] = $(this).prop('checked');
    } else {
      res[$(this).attr('name')] = res[$(this).attr('name')] || [];
      res[$(this).attr('name')].push($(this).prop('checked'));
    }
  });

  return res;
}

// POSTデータをJSON文字列に変換
// id=admin&name=%E5%89%8D%E5%B9%B3&password=test2&description=test3
// id=admin&name=%C1%B0%CA%BF%CD%B5&password=test2&description=test3
// id=admin&name=%91O%95%BD%97T&password=test2&description=test3
// id=admin&name=test1&password=test2&description=test3
// names[]=aaa&names[]=bbb&names[]=ccc
function convertToJson(post_data, code_type) {
  if (post_data == null || post_data == "" || code_type == null) {return};
  
  var decode_func_name = null;
  switch (code_type) {
    case 'UTF-8': decode_func_name='UnescapeUTF8'; break;
    case 'Shift_JIS': decode_func_name='UnescapeSJIS'; break;
    case 'EUC-JP': decode_func_name='UnescapeEUCJP'; break;
    case 'Unicode': decode_func_name='UnescapeUnicode'; break;
    case 'unknown': decode_func_name='UnescapeAutoDetect'; break;
    case undefined: decode_func_name='UnescapeAutoDetect'; break;
  }
  
  var param_obj = {};
  var params = post_data.split('&');
  var arrayCheckRegexp = /\[\]$/;
  
  for (var i=0; i < params.length; i++) {
    var param = params[i].replace(/\+/ig," ");  // + が スペースにデコードされないので無理やり対応
    param = params[i].split('=', 2);
    var name = window[decode_func_name](param[0]);
    var value = window[decode_func_name](param[1]);
    if (name.match(arrayCheckRegexp) == null) {
      param_obj[name] = value;
    } else {
      param_obj[name] = param_obj[name] || [];
      param_obj[name].push(value);
    }
  }
  
  return JSON.stringify(param_obj, null , " ");
}

// 文字コードを自動判別してHTMLデコード
function UnescapeAutoDetect(str) {
  return window["Unescape"+GetEscapeCodeType(str)](str)
};
