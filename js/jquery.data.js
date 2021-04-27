(function($){

	function formatCodes(locale) {
	};

 	$.fn.data = function(options){
		/* --------------------------------------
		   引数の宣言
		----------------------------------------- */
		var options = $.extend({
		}, options);

		/* --------------------------------------
		   public 関数の宣言
		----------------------------------------- */

		$.fn.data.loadShisetsuData = function( seikei, mapFit, callbackFunction ) {

			const lGVal = $.fn.functions.getLocalGovernmentVal(); // 市町村の設定情報を取得
			const lG = $.fn.functions.getLocalGovernment(); // 市町村名を取得

			if( lGVal ) {

				if( !global.shisetsuData[lGVal] ) {
					loadShisetsuData( true, lGVal, lG, seikei, false, mapFit, callbackFunction );
				} else {
					if( $.fn.functions.isType( global.shisetsuData[lGVal][$.fn.functions.getNextTimeValString()] ) == "Object" ) {
						$.fn.functions.displayTimeNav( true );
					} else if( global.shisetsuData[lGVal][$.fn.functions.getNextTimeValString()] == 404 ) {
						$.fn.functions.displayTimeNav( false );
					} else {
						loadShisetsuData( false, lGVal, lG, seikei );
					}
					$.fn.functions.displayServiceNav( true );
					if( $.fn.functions.isNgList( lG ) ) $.fn.functions.displayServiceNav( false ); // NG
					if( callbackFunction ) callbackFunction( mapFit, lGVal, false );
				}

			} else if( global.params.showAllMarkers ) {
				$.fn.maps.removeMarkers();
				$.fn.functions.displayServiceNav( true );
				$.fn.functions.displayTimeNav( false );
				$( global.params.lGValEleId ).find( "option" ).each(function() {
					if( $(this).attr("value") ) loadShisetsuData( true, $(this).attr("value"), $(this).html(), seikei, true, false, callbackFunction );
				});
			}
		}

		$.fn.data.loadGyoseiKukaku = function( reverse, callbackFunction ) {

			if( !global.params.showGyoseiKukaku ) return false;

			const xmlFile = getXmlPath();

			$.ajax( { url: xmlFile,
				type: 'get',
				cache: global.params.xml.cache,
				dataType: 'xml' } )
			.done(function( xmlData ) { // xmlファイルの取得に成功した場合の処理

				let cityName = '';
				let sf = '';
				let cv = '';
				let exGyoseiKukaku = [];
				let inGyoseiKukaku = [];

				$( xmlData ).find( "ksj\\:AdministrativeBoundary" ).each( function() {
					let num = 0;

					if( $.fn.functions.isSeireishi( $( this ).find( "ksj\\:countyName" ).text() ) ) { // 政令市の場合
						cityName = $( this ).find( "ksj\\:countyName" ).text();
					} else { // 政令市以外の場合
						cityName = $( this ).find( "ksj\\:cityName" ).text();
					}

					if( !global.gyoseiKukaku[cityName] ) global.gyoseiKukaku[cityName] = new Array();

					sf = $( this ).find( "ksj\\:bounds" ).attr( "xlink:href" ).replace( /\#/g, '' );

					$( xmlData ).find( "gml\\:Surface[gml\\:id=" + sf + "]" ).each( function() {
						$( this ).find( "gml\\:exterior" ).find( "gml\\:curveMember" ).each( function() {
							cv = $( this ).attr( "xlink:href" ).replace( /^\#_/g, '' );
							$( xmlData ).find( "gml\\:Curve[gml\\:id=" + cv + "]" ).find( "gml\\:posList" ).each( function() {
								exGyoseiKukaku.push( seikeiLatLngCords( $(this).text() ) );
							});
						});
						$( this ).find( "gml\\:interior" ).find( "gml\\:curveMember" ).each( function() {
							cv = $( this ).attr( "xlink:href" ).replace( /^\#_/g, '' );
							$( xmlData ).find( "gml\\:Curve[gml\\:id=" + cv + "]" ).find( "gml\\:posList" ).each( function() {
								inGyoseiKukaku.push( seikeiLatLngCords( $(this).text() ) );
							});
						});
						if( inGyoseiKukaku[0] ) {
							global.gyoseiKukaku[cityName].push( [ exGyoseiKukaku, inGyoseiKukaku ] );
						} else {
							global.gyoseiKukaku[cityName].push( [ exGyoseiKukaku ] );
						}
						exGyoseiKukaku = [];
						inGyoseiKukaku = [];
					});
				});
				if( callbackFunction ) callbackFunction( reverse );
			}).fail(function( jqXHR ) { // xmlファイルの取得に失敗した場合の処理
				console.log( jqXHR.status + "：XMLの取得に失敗しました。" );
			});
		}

		/* --------------------------------------
		   private 関数の宣言
		----------------------------------------- */

		function loadShisetsuData( first, lGVal, lG, seikei, showAll, mapFit, callbackFunction ) {

			if( !global.params.enableTimeNav && !first ) return;

			let time = new String();
			let csvFile = new String();

			if( first ) {
				time = $.fn.functions.getTimeValString();
				csvFile = getCsvPath( lGVal, global.params.csv.fileName );
			} else {
				time = $.fn.functions.getNextTimeValString();
				csvFile = getCsvPath( lGVal, global.params.csv.nextTimeFileName );
			}

			$.ajax( { url: csvFile,
				type: 'get',
				cache: global.params.csv.cache } )
			.done(function( csvData ) { // csvファイルの取得に成功した場合の処理
				if( first ) { 
					loadShisetsuData( false, lGVal, lG, seikei, showAll );
					global.shisetsuData[lGVal] = new Object;
					$.fn.functions.displayServiceNav( true );
				} else if( !showAll ) {
					$.fn.functions.displayTimeNav( true );
				}
				csvData = $.csv.toArrays( csvData );
				var shisetsuData = csvDataToShisetsuData( csvData, lG );
				if( seikei ) seikeiShisetsuData( shisetsuData );
				global.shisetsuData[lGVal][time] = shisetsuData;
				if( first && callbackFunction ) callbackFunction( mapFit, lGVal, showAll );

			}).fail(function( jqXHR ) { // csvファイルの取得に失敗した場合の処理
				if( first && !showAll ) {
					$.fn.maps.removeMarkers();
					$.fn.functions.displayServiceNav( false );
					if( jqXHR.status == 404 ) {
						$.fn.functions.showErrorDialog( 3.1 );
					} else {
						$.fn.functions.showErrorDialog( 3.2 );
					}
				}
				if( !first ) {
					$.fn.functions.displayTimeNav( false );
					$.fn.functions.removeUrlQuerie( "time" );
				}
				console.log( jqXHR.status + ":" + csvFile + "の取得に失敗しました。" );
			});
		}

		function seikeiShisetsuData( shisetsuData ) { // CSVデータの中身をパラメータの設定及びシステムが扱えるよう整形
			if( !$.fn.functions.isType( shisetsuData ) == "Object" ) return false;
			for( let key in shisetsuData ) {
				if( $.fn.functions.isType( shisetsuData[key] ) == "Object" ) {
					seikeiShisetsuData( shisetsuData[key] );
				} else if( key ) {
					shisetsuData[key] = zenkakuHankaku( shisetsuData[key] );
				}
			}
		}

		function zenkakuHankaku( str ) { // 全角英数字を半角へ変換
			return String(str).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
				return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
			});
		}

		function csvDataToShisetsuData( csvData, lG ) { // CSVデータを各施設のデータへと整形
			let shisetsuData = {};
			let shisetsu = {};
			for( var i = 1; i < csvData.length; i++ ) {
				for( var j = 0; j < csvData[i].length; j++ ) {
					shisetsu[String(csvData[0][j])] = csvData[i][j];
				}
				shisetsu[global.shisetsuData.lGNameKey] = lG;
				shisetsuData[i-1] = shisetsu;
				shisetsu = {};
			}
			return shisetsuData;
		}

		function getCsvPath( lGVal, fileName ) { // CSVファイルのパスを取得
			let csvPath = global.params.csv.folder + lGVal + "/";
			if( global.params.csv.lGAfterFolder ) csvPath += global.params.csv.lGAfterFolder;
			csvPath += fileName;
			if( !global.params.csv.cache ) csvPath += "?nocache=" + $.fn.functions.getDate( true, true, true, false, false, false );
			return csvPath;
		}

		function getXmlPath() { // XMLファイルのパスを取得
			let xmlPath = global.params.xml.folder + global.params.xml.fileName;
			if( !global.params.xml.cache ) xmlPath += "?nocache=" + $.fn.functions.getDate( true, true, true, false, false, false );
			return xmlPath;
		}

		function seikeiLatLngCords( cords ) { // XMLの座標データを整形
			const latsLngs = cords.split( /[\n]/g );
			let seikeiLatsLngs = [];
			let latLng = "";
			let i = 0;

			for( var key in latsLngs ) {
				latLng = latsLngs[key].replace( /^\s+/g, '' );
				if( latLng ) {
					seikeiLatsLngs[i] = latLng.split(" ");
					i ++;
				}
			}
			return seikeiLatsLngs;
		}
	};
})(jQuery);
