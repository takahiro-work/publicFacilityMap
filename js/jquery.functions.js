(function($){

	function formatCodes(locale) {
	};

 	$.fn.functions = function(options){

		/* --------------------------------------
		   引数の宣言
		----------------------------------------- */
		var options = $.extend({
		}, options);

		/* --------------------------------------
		   public 関数の宣言
		----------------------------------------- */

		$.fn.functions.isType = function(x) { // データ型判定関数
			return (x != x)? "NaN": (x === Infinity || x === -Infinity)? "Infinity": Object.prototype.toString.call(x).slice(8, -1);
		}

		$.fn.functions.isNumber = function(val) { // 0以上の整数のみを判定
			let regexp = new RegExp(/^[0-9]+(\.[0-9]+)?$/);
			return regexp.test(val);
		}

		$.fn.functions.isUrl = function( str ) { // 文字列がURLか判定

			let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name	
				'((\\d{1,3}\\.){3}\\d{1,3})|'+ // OR ip (v4) address
				'((([\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]|[\uD840-\uD87F][\uDC00-\uDFFF]|[ぁ-んァ-ヶ])*)\\.)+[a-z]{2,})'+ // OR japanese url
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
				'(\\#.*)?$','i'); // fragment locator
			return !!pattern.test(str);
		}

		$.fn.functions.isTel = function( str ) {  // 文字列が電話番号か判定
			let judge = true;
			let tel = str.replace(/[━.*‐.*―.*－.*\-.*ー.*|　.*]/gi,'');
			if( tel ) tel = tel.match( /\+?[0-9]+[\-\x20]?[0-9]+[\-\x20]?[0-9]+[\-\x20]?[0-9]+/g )[0];
			if ( !tel.match(/^(0[5-9]0[0-9]{8}|0[1-9][1-9][0-9]{7})$/) ) judge = false;
			return judge;
		}

		$.fn.functions.convertTelToAnchorTag = function( str ) { // 電話番号リンクを付けて返す
			// 電話番号だと思われる文字列を抽出
			const phoneArray = str.match( /\+?[0-9]+[\-\x20]?[0-9]+[\-\x20]?[0-9]+[\-\x20]?[0-9]+/g );
			let cursor = 0;
			for ( var i = 0; phoneArray != null && i < phoneArray.length; i++ ) {

				// ハイフンとスペースを削除
				let tmp = phoneArray[i];
				tmp = tmp.replace( /[\-\x20]/g, '' );
				if ( tmp.length < 10 ) continue; // 10桁未満は電話番号とみなさない

				// aタグ文字列を生成
				const tag_a = '<a href="tel:' + tmp + '">' + phoneArray[i] + '</a>';

				// 置換する電話番号の出現位置を取得
				const start = str.indexOf( phoneArray[i], cursor );

				// 出現した電話番号を置換
				str = str.slice( 0, start ) + tag_a + str.slice( start + phoneArray[i].length );
				cursor = start + tag_a.length;
			}
			return str;
		}

		$.fn.functions.changeArrayOrObject = function( arrayOrObject ) { // 配列を連想配列に、連想配列を配列に変換して返す
			var changed;
			if( $.fn.functions.isType( arrayOrObject ) == "Array" ) {
				changed = {};
				for( var i = 0; i < arrayOrObject.length; i++ ) {
					changed[i] = arrayOrObject[i];
				}
				return changed;
			} else if( $.fn.functions.isType( arrayOrObject ) == "Object" ) {
				changed = [];
				for( var key in arrayOrObject ) {
					changed.push( arrayOrObject[key] );
				}
				return changed;
			}
		}

		$.fn.functions.isDebug = function() {
			return (location.hostname != global.params.hostname );
		}

		$.fn.functions.isSmartDevice = function() { // クライアントがスマートデバイスの場合にTrueを返す
			if ( navigator.userAgent.match(/(iPhone|iPad|iPod|Android.+Mobile)/) ) {
				return true;
			} else {
				return false;
			}
		}

		$.fn.functions.isEnabledWord = function( word ) { // 空きがあると判断される文言か判定
			let judge = false;
			if( word ) {
				const enabledWords = global.params.shisetsuInfo.enabledWords;
				for( var key in enabledWords ) {
					if( enabledWords[key] == word ) {
						judge = true;
						break;
					}
				}
			}
			return judge;
		}

		$.fn.functions.setLocalGovernment = function( localGovernment ) { // 市町村のパラメータ設定に合わせ、市町村セレクトメニューを設定
			if( $( !localGovernment || global.params.lGValEleId + ' option:selected' ).text() == localGovernment ) return false;
			$( global.params.lGValEleId ).find( "option" ).each(function() {
				if( $(this).html() == localGovernment ) {
					$( global.params.lGValEleId ).val( $(this).attr("value") );
				}
			});
		}

		$.fn.functions.getLocalGovernment = function() { // 市町村セレクタメニューの市町村名を取得 ※日本語表記
			return $( global.params.lGValEleId ).find( "option:selected" ).html();
		}

		$.fn.functions.getLocalGovernmentVal = function() { // 市町村セレクターメニューの設定状況を返す ※半角英表記
			return $( global.params.lGValEleId ).val();
		}

		$.fn.functions.addTimeSelect = function( time ) { // 年度セレクトのメニューを追加
			$( global.params.timeValEleId ).append('<option value="' + $.fn.functions.getTimeValString() + '" selected>' + time + '年度中</option>');
			$( global.params.timeValEleId ).append('<option value="' + $.fn.functions.getNextTimeValString() + '">' + Number(time + 1) +'年4月</option>');
		}

		$.fn.functions.setTime = function( time ) { // 年度のパラメータ設定に合わせ、年度セレクトメニューを設定
			if( !time ) return false;
			$( global.params.timeValEleId ).val( time );
		}

		$.fn.functions.getGennendo = function( timePlus ) { // 現時点の年度情報を取得する
			if( timePlus == null ) timePlus = 0;
			let date = new Date();
			date.setMonth(date.getMonth() - 3);
			return  Number( date.getFullYear() + timePlus );
		}

		$.fn.functions.resetTimeVal = function() { // 年度選択メニューの値を規定値に戻す
			if( $( global.params.timeValEleId ).val() != $.fn.functions.getTimeValString() ) {
				$( global.params.timeValEleId ).val( $.fn.functions.getTimeValString() );
				$.fn.functions.removeUrlQuerie("time");
			}
		}

		$.fn.functions.getTimeVal = function() { // 年度セレクターメニューの設定状況を返す
			return $( global.params.timeValEleId ).val();
		}

		$.fn.functions.getTimeValString = function() {
			return global.params.csv.fileName.match( /^[^\.]*/g )[0];
		}

		$.fn.functions.getNextTimeValString = function() {
			return global.params.csv.nextTimeFileName.match( /^[^\.]*/g )[0];
		}

		$.fn.functions.getDate = function( year, month, day, hour, minute, seconds ) { // 現在の年月日分時間秒を返す
			const date = new Date();
			let nowDate = '';
			if( year ) nowDate += String( date.getFullYear() );
			if( month ) nowDate += String( ( '0' + ( date.getMonth() + 1 ) ).slice( -2 ) );
			if( day ) nowDate += String( ( '0' + date.getDate() ).slice( -2 ) );
			if( hour ) nowDate += String( ( '0' + date.getHours() ).slice( -2 ) );
			if( minute ) nowDate += String( ( '0' + date.getMinutes() ).slice( -2 ) );
			if( seconds ) nowDate += String( ( '0' + date.getSeconds() ).slice( -2 ) );
			return nowDate;
		}

		$.fn.functions.displayCategoryNav = function( bln ) { // 施設の種類セレクトメニューを表示・非表示
			if( !global.params.enableCategoryNav ) return;
			if( bln == true ) {
				$( global.params.categoryValEleId ).parent().css( "display", "block" );
			} else if( bln == false ) {
				$( global.params.categoryValEleId ).parent().css( "display", "none" );
			} else {
				return false;
			}
		}

		$.fn.functions.displayServiceNav = function( bln ) { // 年齢チェックボックスメニューを表示・非表示
			if( !global.params.enableServiceNav ) return;
			if( bln == true ) {
				$( global.params.serviceValEleId ).css( "display", "block" );
			} else if( bln == false ) {
				$( global.params.serviceValEleId ).css( "display", "none" );
			} else {
				return false;
			}
		}

		$.fn.functions.displayTimeNav = function( bln ) { // 年度セレクトメニューを表示・非表示
			if( !global.params.enableTimeNav ) return;
			if( bln == true ) {
				$( global.params.timeValEleId ).parent().css( "display", "block" );
			} else if( bln == false ) {
				$( global.params.timeValEleId ).parent().css( "display", "none" );
			} else {
				return false;
			}
		}

		$.fn.functions.getCategoryVal = function() { // 施設の種類の選択状況を返す
			return $( global.params.categoryValEleId ).find( "option:selected" ).val();
		}

		$.fn.functions.setServiceCheckbox = function( serviceList ) { // 年齢のパラメータ設定に合わせ、年齢チェックボックスを設定
			if( !serviceList.length ) return false;
			for( var i = 0; i < serviceList.length; i++ ) {
				$( global.params.serviceValEleId ).find("input:eq(" + i + ")").prop('checked', serviceList[i]);
			}
		}

		$.fn.functions.getServiceVals = function() { // 年齢のチェックボックスの状況を配列で返す
			let check = {};
			var i = 0;
			$( global.params.serviceValEleId ).find("input:checked").each(function() {
				check[i] = $(this).val();
				i ++;
			});
			return check;
		}

		$.fn.functions.getUrlQueries = function() { // URLクエリを連想配列で返す
			const queryStr = window.location.search.slice(1);
			if(!queryStr) return false;
			let queries = {};
			queryStr.split('&').forEach(function(queryStr) {
				var queryArr = queryStr.split('=');
				queries[queryArr[0]] = queryArr[1];
			});
			return queries;
		}

		$.fn.functions.addUrlQuerie = function( key, value ) { // URLクエリを追加

			key = encodeURI(key); value = encodeURI(value);
			let kvp = document.location.search.substr(1).split('&');

			var i = kvp.length; var x; while(i--) {
				x = kvp[i].split('=');

				if (x[0]==key) {
					x[1] = value;
					kvp[i] = x.join('=');
					break;
				}
			}

			if(i<0) {kvp[kvp.length] = [key,value].join('=');}

			if( !document.location.search) {
				history.replaceState( null, null, '?' + kvp.join('') );
			} else {
				history.replaceState( null, null, '?' + kvp.join('&') );
			}
		}

		$.fn.functions.removeUrlQuerie = function( queryKey ) { // URLクエリを削除

			let urlQueryString = document.location.search;
			let newQueryString = "";

			const url = document.location.href.split("?")[0];

			if (urlQueryString !== "") {

				let params = urlQueryString.slice(1).split("&"); // クエリストリング毎に分割

				for (var i = 0; i < params.length; i++) { // クエリストリング確認用
					let param = params[i].split("=");
					let key = param[0];
					let value = param[1];

					if (key == queryKey) continue; // 該当するクエリストリングは無視

					if ( newQueryString !== "" ) { // 新たにクエリストリングを作成
						newQueryString += "&";
					} else {
						newQueryString += "?";
					}
					newQueryString += key + "=" + value;
				}
			}
			if( newQueryString == "" ) {
				history.replaceState( null, null, url );
			} else {
				history.replaceState( null, null, newQueryString );
			}
		}

		$.fn.functions.trimHashId = function( hashId ) {
			return hashId.match( /[^#]*$/g )[0];
		}

		$.fn.functions.isSeireishi = function( lGName ) { // 自治体名が政令市にあたるか判定
			let judge = false;
			for( var i = 0; i < global.params.xml.seireishi.length; i++ ) {
				if( global.params.xml.seireishi[i] == lGName ) {
					judge = true;
					break;
				}
			}
			return judge;
		}

		$.fn.functions.setParams = function( paramArr, setArr ) { // パラメータの値を設定

			if( !$.fn.functions.isType( paramArr ) == "Object" || !$.fn.functions.isType( setArr ) == "Object" ) return false;

			for( var key in paramArr ) {
				if( Array.isArray(paramArr[key]) && setArr[key] ) $.functions.setParams( paramArr[setArr], setArr[key] );
				for( var i = 0; i < global.params.protectOverWriteLists.length; i++ ) {
					if( setArr[key] && key != global.params.protectOverWriteLists[i] ) {
						if( isNaN( paramArr[key] ) ) {
							paramArr[key] = decodeURI(setArr[key]);
						} else {
							paramArr[key] = Number(setArr[key]);
						}
					}
				}
			}
		}

		$.fn.functions.showErrorDialog = function( errorNum ) {  // エラーメッセージ表示
			$("#dialog-error-title").html('<h2 class="uk-h5">' + global.errorDialog[errorNum]["title"] + '</h2>');
			$("#dialog-error-body").html('<p>' + global.errorDialog[errorNum]["description"] + '</p>');
			UIkit.modal("#dialog-error").show();
		}

		$.fn.functions.isNgList = function( lG ) { // NG
			let judge = false;
			if( lG ) {
				const ngList = global.params.ngList;
				for( var key in ngList ) {
					if( ngList[key] == lG ) {
						judge = true;
						break;
					}
				}
			}
			return judge;
		}
	}
})(jQuery);
