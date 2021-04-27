/* --------------------------------------
 グローバル変数の宣言
----------------------------------------- */

let global = {}
global.params = {}
global.shisetsuData = {}
global.gyoseiKukaku = {}
global.errorDialog = {}

/* --------------------------------------
  パラメータの設定
----------------------------------------- */

global.params = {
        mapCenter: { lat:34.641332, lng:135.562939 }, // マップの初期表示点を設定する場合は入力 例：{ lat:34.641332, lng:135.562939 }
	prefecture: '大阪府', // 対象の都道府県を設定
	localGovernment: '', // 対象の市町村を設定
	address: '', // 既定の初期表示住所がある場合は設定
	time: '', // プログラム中で設定
	zoomLevel: 11, // 初期ズームレベルを設定
	addressZoomLevel: 16, // 住所検索のズームレベルを設定
	currentZoomLevel: 18, // 現在地表示のズームレベルを設定
	fitBoundsPadding: 70, // マップ表示自動調整時の余白設定(px)
	mapEleId: '#map-canvas', // Google Maps を表示する要素のIDを指定
	searchInputEleId: '#search-text-field', // 検索窓とする要素のIDを指定
	searchBtnEleId: '#search-button', // 検索ボタンとする要素のIDを指定
	searchContainerId: '#search-container', // 検索窓要素を格納する要素のIDを指定
	searchFormEleId: '#search-form', // 検索要素を格納するFORM要素のIDを指定
	currentBtnEleId: '#current-location', // 現在地ボタンとする要素のIDを指定
	currentContainerId: '#nav-current', // 現在地ボタン要素を格納する要素のIDを指定
	currentEleId: '#current', // 現在地表示アイコンの要素のIDを指定
	navContainerId: '#nav', // ナビゲーションメニューを格納する要素のIDを指定
	lGValEleId: '#nav-query1', // 市町村選択メニューの要素のIDを指定
	timeValEleId: '#nav-query2', // 時系選択メニューの要素のIDを指定
	serviceValEleId: '#nav-query3', // サービス選択メニューの要素のIDを指定
	searchAutoComplete: false, // 検索のオートコンプリートを使用するか指定
	enableServiceNav: true,
	enableTimeNav: false,
	setCurrentLg: false,
	showGyoseiKukaku: false, // 行政区画表示の有無
	showAllMarkers: true, // 自治体を未選択の場合、すべてのマーカーの一括表示するか
	googleMaps: { 
		apiKey: 'AIzaSyC_EVZwa4PowMAavtIei27lgc8csXIHGhg', // Google Maps API キーを設定
		baseApiUri: 'https://maps.googleapis.com/maps/api/js?callback=instructions&libraries=places&region=JP&language=ja&key={apiKey}',
		baseKeiroUri1: 'https://www.google.co.jp/maps?q={address}&openExternalBrowser=1',
		baseKeiroUri2: 'https://www.google.co.jp/maps/dir/?api=1&origin={address2}&destination={address1}&openExternalBrowser=1'
	},
	mapOptions: { // Google Maps の設定オプション
		mapTypeControl: false,
		fullscreenControl: false,
		gestureHandling: 'greedy',
		streetViewControl: false,
		clickableIcons: false,
		disableDoubleClickZoom: false
	},
	searchMarkerOptions: { // 検索マーカーの設定オプション
		flat: true,
		optimized: false,
		visible: true,
		title: '検索地点'
	},
	currentMarkerOptions: { // 現在地マーカーの設定オプション
		flat: true,
		optimized: false,
		visible: true,
		title: '現在地'
	},
	drawOptions: { // Polygon の設定オプション
		clickable: false,
		strokeWeight: 0,
		fillColor: '#111111',
		fillOpacity: 0.1,
		visible: true
	},
	searchOptions: { // 検索の設定オプション
		types: ['(regions)'], // 検索タイプ
		componentRestrictions: { country: 'jp' } // 日本国内の住所のみ
	},
	csv: { // csv(市町村窓口、施設データ)に関するパラメータ設定
		folder: './Data/', // csvファイルの格納場所を指定
		lGAfterFolder: '', // 市町村名(市町村セレクタメニューのvalue)のフォルダ後にフォルダ階層がある場合は指定
		fileName: 'data.csv',
		nextTimeFileName: 'data-next.csv',
		cache: false // ブラウザキャッシュ使用の有無
	},
	xml: { // xml(行政区画データ)に関するパラメータ設定
		folder: './xml/', // xmlファイルの格納場所を指定
		fileName: 'N03-20_27_200101.xml', // 国土交通省の行政区画データ(JPGIS2.1(GML))のxmlを使用
		cache: true, // ブラウザキャッシュ使用の有無
		seireishi: [ // 政令指定都市名の一覧
			'札幌市',
			'仙台市',
			'さいたま市',
			'千葉市',
			'横浜市',
			'川崎市',
			'相模原市',
			'新潟市',
			'静岡市',
			'浜松市',
			'名古屋市',
			'京都市',
			'大阪市',
			'堺市',
			'神戸市',
			'岡山市',
			'広島市',
			'北九州市',
			'福岡市',
			'熊本市'
		]
	},
	shisetsuInfo: { // 施設に関するパラメータ設定
		category: {
			0: "授乳スペース",
			1: "おむつ替えスペース"
		},
		enabledWords: [ // 数字以外に空きがあると判定する文言
			'○', // 記号の丸
			'〇', // 漢数字の丸
			'◎',
			'△',
			'若干名',
			'調整中',
			'要問合せ'
		]
	},
	marker: { // マーカーに関するパラメータ設定
		imagesFolder: './img/',
		imageFile: {
			current: {
				fileName: 'current.png',
				width: 15,
				height: 15
			},
			point: {
				row: {
					fileName: 'point_row.png',
					width: 34,
					height: 48
				},
				high: {
					fileName: 'point_high.png',
					width: 34,
					height: 48
				}
			},
			0: {
				row: { // pc
					fileName: 'both.png',
					width: 36,
					height: 35
				},
				high: { // スマートフォン
					fileName: 'both.png',
					width: 36,
					height: 35
				}
			},
			1: {
				row: { // pc
					fileName: 'junyu.png',
					width: 36,
					height: 35
				},
				high: { // スマートフォン
					fileName: 'junyu.png',
					width: 36,
					height: 35
				}
			},
			2: {
				row: { // pc
					fileName: 'omutsu.png',
					width: 36,
					height: 35
				},
				high: { // スマートフォン
					fileName: 'omutsu.png',
					width: 36,
					height: 35
				}
			}	
		}
	},
	serviceCheck: {
		"授乳スペース": false,
		"おむつ替えスペース": false
	},
	protectOverWriteLists: [ // パラメータの上書きを制限する項目
		'protectOverWriteLists',
		'googleMaps',
		'mapEleId',
		'searchInputEleId',
		'searchBtnEleId',
		'searchContainerId',
		'currentBtnEleId',
		'lGValEleId',
		'serviceValEleId'
	]
}

global.shisetsuData = {
	lGNameKey: '自治体名' // 各施設データで自治体名を格納する連想配列キー
}

global.errorDialog = {
	0.1: {
		title: '読み込みエラー',
		description: '地図の初期表示に失敗しました。<br />恐れ入りますが、このページを再度読み込みいただくか、改善しない場合は日を改めてアクセスをお願いします。'
	},
	1.1: {
		title: '位置情報取得エラー',
		description: 'ご利用の端末では、位置情報を取得できません。'
	},
	1.2: {
		title: '位置情報取得エラー',
		description: '現在地の位置情報を取得できませんでした。<br />ご利用の端末のGPS機能をONにして屋外でご利用ください。<br />端末によっては、現在位置を取得するまで時間がかかる場合があります。'
	},
	2.1: {
		title: '検索エラー',
		description: '住所の検索に失敗しました。有効な住所を入力してください。'
	},
	2.2: {
		title: '検索エラー',
		description: '住所の特定に失敗しました。より具体的な住所を入力してください。'
	},
	3.1: {
		title: '準備中',
		description: '対象自治体のデータは準備中です。<br />公開準備の整った市町村から順次公開・更新いたします。'
	},
	3.2: {
		title: '読み込みエラー',
		description: '対象自治体のデータの読み込みに失敗しました。<br />恐れ入りますが、このページを再度読み込みいただくか、改善しない場合は日を改めてアクセスをお願いします。'
	},
	3.9: {
		title: '堺市のサービスをご利用ください',
		description: '堺市の保育施設の状況確認については、堺市のアプリからご確認をお願いします。'
	}
}

/* --------------------------------------
   Google Maps タグの埋め込み
----------------------------------------- */

document.addEventListener( 'DOMContentLoaded', function () {
	let jsFile = document.createElement( 'script' );
	jsFile.type = 'text/javascript';
	jsFile.src = global.params.googleMaps.baseApiUri.replace( '{apiKey}', global.params.googleMaps.apiKey );
	document.getElementsByTagName( 'head' )[0].appendChild( jsFile );
});

/* --------------------------------------
   機能の実行
----------------------------------------- */

function instructions() {

	/* --------------------------------------
	   プラグインの読み込み
	----------------------------------------- */
	$.fn.functions();
	$.fn.data();
	$.fn.maps();

	$.fn.functions.setParams( global.params, $.fn.functions.getUrlQueries() );

	if( $.fn.functions.isSmartDevice() && navigator.geolocation ) global.params.showAllMarkers = true;

	if( global.params.localGovernment ) { // URLクエリで自治体の指定がある場合の処理
		$.fn.functions.setLocalGovernment( global.params.localGovernment );
		$.fn.functions.addUrlQuerie( 'localGovernment', global.params.localGovernment );
	}

	$.fn.functions.addTimeSelect( $.fn.functions.getGennendo() );
	$.fn.functions.setServiceCheckbox( $.fn.functions.changeArrayOrObject( global.params.serviceCheck ) );

	$.fn.functions.setTime( global.params.time );

	$.fn.maps.callbackGoogleMapsApi();

	if( $.fn.functions.isSmartDevice() ) $.fn.maps.getPosFromGPS(); // スマートデバイスの場合、現在地表示

	$( global.params.currentBtnEleId ).click(function() { // 現在地ボタンのイベント設定
		$.fn.maps.getPosFromGPS();
	});

	$( global.params.serviceValEleId ).find( 'input') .change(function() { // 年齢選択のイベント設定
		$.fn.data.loadShisetsuData( true, false, $.fn.maps.createMarkers );
	});

	$( global.params.lGValEleId ).change(function() { // 市町村選択のイベント設定
		$.fn.functions.resetTimeVal();
		$.fn.maps.removeMarkers();
		$.fn.maps.removeGyoseiKukaku();
		$.fn.data.loadShisetsuData( true, true, $.fn.maps.createMarkers );
		if( $.fn.functions.getLocalGovernmentVal() ) {
			$.fn.maps.drawGyoseiKukaku( true, $.fn.functions.getLocalGovernment() );
			$.fn.functions.addUrlQuerie( 'localGovernment', $.fn.functions.getLocalGovernment() );
		} else {
			$.fn.functions.removeUrlQuerie( 'localGovernment' );
		}
	});

	/*$( global.params.timeValEleId ).change(function() { // 年度選択のイベント設定
		$.fn.data.loadShisetsuData( true, false, $.fn.maps.createMarkers );
		if( $.fn.functions.getTimeVal() == $.fn.functions.getTimeValString() ) {
			$.fn.functions.removeUrlQuerie( 'time' );
		} else {
			$.fn.functions.addUrlQuerie( 'time', $.fn.functions.getTimeVal() );
		}
	});*/

	$( global.params.searchInputEleId ).on( 'click blur keydown keyup keypress change', function() { // 検索ボックスが空白の場合
		if( !$(this).val() ) {
			$.fn.functions.resetTimeVal();
			$.fn.maps.removeSearchMarker();
			$.fn.functions.removeUrlQuerie( 'address' );
		}
	});

	$( global.params.searchBtnEleId ).on( 'click', function() { // 検索ボタンのイベント設定
		$.fn.maps.search();
	});

	setTimeout( function() { // マップが読み込まれる前に実行すると描画が反映されないため、0.8秒遅らせて実行
		$.fn.data.loadGyoseiKukaku( true, $.fn.maps.drawGyoseiKukaku );
	},800);
}
