(function($){

	function formatCodes(locale) {
	};

 	$.fn.maps = function(options){
		/* --------------------------------------
		   引数の宣言
		----------------------------------------- */
		var options = $.extend({
		}, options);

		/* --------------------------------------
		   変数の宣言
		----------------------------------------- */

		// マップ
		let map;
		let geocoder;
		let mapCenter = {};
		let mapFitBounds = {};
		let trackingMapSwipe;
		let trackingMapZoom;
		let watchPosition = [];

		// 検索
		let searchInput;
		
		// エリア
		let gyoseiKukakus = [];

		// マーカー
		let markers = {};
		let searchMarker = [];
		let currentMarker = [];
		let markersLoaded = {};

		// 施設紹介ウィンドウ
		let infoWindows = [];
		let currentInfoWindow = null;

		// 現在地
		let firstPosLoad = true;

		/* --------------------------------------
		   public 関数の宣言
		----------------------------------------- */

		$.fn.maps.callbackGoogleMapsApi = function() {
			if( global.params.address ) { // 住所の指定がある場合は住所で初期地図を設定
				codeAddress( global.params.address, true );
				$( global.params.searchInputEleId ).val( global.params.address );
			} else if( global.params.mapCenter["lat"] && global.params.mapCenter["lng"] ) { // パラメータでマップ中心地の指定がある場合は処理
				setMap( global.params.mapCenter, global.params.zoomLevel );
			} else if( global.params.prefecture || global.params.localGovernment ) { // 住所指定や中心地指定がない場合は都道府県 + 市町村で初期地図を設定
				codeAddress( global.params.prefecture + global.params.localGovernment, false ); 
			}
		}

		$.fn.maps.search = function( address ) { // 検索ボタン押下時のイベント

			if( address ) $( global.params.searchInputEleId ).val( address );

			if( global.params.searchAutoComplete ) {
				google.maps.event.trigger( searchInput, 'focus', {} );
				google.maps.event.trigger( searchInput, 'keydown', {
					keyCode: 13
				});
				$( global.params.searchInputEleId ).blur();
			} else {
				$( global.params.searchFormEleId ).submit();
			}
		}

		$.fn.maps.createMarkers = function( mapFit, lGVal, showAll ) { // マーカーの一括作成

			if( !showAll ) $.fn.maps.removeMarkers(); // マーカー一括作成前に一括リセット

			if( !lGVal ) lGVal = decodeURI( $.fn.functions.getLocalGovernmentVal() );
			const time = $.fn.functions.getTimeVal();

			let noLatLng = [];

			for( var key in global.shisetsuData[lGVal][time] ) {
				if( global.shisetsuData[lGVal][time][key]["緯度"] && global.shisetsuData[lGVal][time][key]["経度"] ) { // 緯度・経度を指定している場合は参照
					global.shisetsuData[lGVal][time][key]["緯度"] = Number( global.shisetsuData[lGVal][time][key]["緯度"] );
					global.shisetsuData[lGVal][time][key]["経度"] = Number( global.shisetsuData[lGVal][time][key]["経度"] );
					checkFitBounds( global.shisetsuData[lGVal][time][key]["緯度"], global.shisetsuData[lGVal][time][key]["経度"] );
					createMarkerIcon( global.shisetsuData[lGVal][time][key], String( lGVal + key ) );
				} else { 
					noLatLng.push( key );
				}
			}
			if( !noLatLng.length && mapFit ) fitBounds( mapFitBounds ); // ジオコーダーで座標を取得していない場合、このまま地図の表示範囲を調整

			if( noLatLng.length ) { // 経度・緯度の指定がない場合は住所から緯度・経度を取得
				let count = 0;
				const order = setInterval( function() {
					markerAddress( lGVal, time, noLatLng[count], mapFit );
					count ++;
					if( !noLatLng[count] ) clearInterval( order );
				}, 100);
			}
		}

		$.fn.maps.drawGyoseiKukaku = function( reverse, localGovernment ) { // 市町村エリアを地図上に描画する

			if( !global.params.showGyoseiKukaku ) return false;

			if( !localGovernment ) localGovernment = $.fn.functions.getLocalGovernment();
			if( localGovernment ) {
				if( Object.keys( global.gyoseiKukaku ).length && global.gyoseiKukaku[localGovernment] ) {

					const latLngData = global.gyoseiKukaku[localGovernment];
					let gyoseiKukaku = [];
					let exGyoseiKukaku = [];
					let inGyoseiKukaku = [];

					if( reverse ) { // 描画範囲を反転する場合
						const everythingElse = [ //地図全体を覆うポリゴン用座標データ（反時計回り）
							new google.maps.LatLng(90, 180),
							new google.maps.LatLng(90, 0),
							new google.maps.LatLng(-90, 0),
							new google.maps.LatLng(-90, 180),
							new google.maps.LatLng(90, -180),
							new google.maps.LatLng(90, 0),
							new google.maps.LatLng(-90, 0),
							new google.maps.LatLng(-90, -180)
						];
						gyoseiKukaku.push( everythingElse );

						for( var i = 0; i < latLngData.length; i++ ) {
							for( var j = 0; j < latLngData[i][0][0].length; j ++ ) { // 境界（外延）の設定・描画
								exGyoseiKukaku.push( new google.maps.LatLng( latLngData[i][0][0][j][0], latLngData[i][0][0][j][1] ) );
							}
							gyoseiKukaku.push( exGyoseiKukaku );
							exGyoseiKukaku = [];
							if( latLngData[i][1] ) { // 境界（内延：他区市町村の飛地等）の設定・描画
								for( var j = 0; j < latLngData[i][1].length; j ++ ) {
									for( var k = 0; k < latLngData[i][1][j].length; k ++ ) {
										inGyoseiKukaku.push( new google.maps.LatLng( latLngData[i][1][j][k][0], latLngData[i][1][j][k][1] ) );
									}
									gyoseiKukakus.push( drawArea( inGyoseiKukaku, global.params.drawOptions ) );
									inGyoseiKukaku = [];
								}
							}
						}
						gyoseiKukakus.push( drawArea( gyoseiKukaku, global.params.drawOptions ) );
					} else {
						for( var i = 0; i < latLngData.length; i++ ) {
							for( var j = 0; j < latLngData[i][0][0].length; j ++ ) { // 境界（外延）の設定・描画
								exGyoseiKukaku.push( new google.maps.LatLng( latLngData[i][0][0][j][0], latLngData[i][0][0][j][1] ) );
							}
							gyoseiKukaku.push( exGyoseiKukaku );
							if( latLngData[i][1] ) { // 境界（内延：他区市町村の飛地等）の設定・描画
								for( var j = 0; j < latLngData[i][1].length; j ++ ) {
									for( var k = 0; k < latLngData[i][1][j].length; k ++ ) {
										inGyoseiKukaku.push( new google.maps.LatLng( latLngData[i][1][j][k][0], latLngData[i][1][j][k][1] ) );
									}
									gyoseiKukaku.push( inGyoseiKukaku );
									inGyoseiKukaku = [];
								}
							}
							gyoseiKukakus.push( drawArea( gyoseiKukaku, global.params.drawOptions ) );
							gyoseiKukaku = [];
							exGyoseiKukaku = [];
							inGyoseiKukaku = [];
						}
					}
				} 
			} 
		}

		$.fn.maps.getPosFromGPS = function() { // 現在地を取得

			trackingMapSwipe = false;
			trackingMapZoom = false;
			$.fn.maps.clearWatchPosition();

			if( navigator.geolocation ) { // Geolocation APIに対応している場合
				if( !watchPosition.length ) { // watchPosition のイベントがない場合
					watchPosition.push(navigator.geolocation.watchPosition(

						function ( position ) { // 現在地取得に成功した場合の関数

							const latitude  = position.coords.latitude; //緯度
							const longitude = position.coords.longitude; //経度
							const latLng = new google.maps.LatLng( latitude, longitude );

							if( currentMarker.length ) {
								currentMarker[0].setPosition( latLng );
							} else {
								const markerIcon = global.params.marker.imageFile.current;
								let icon = {
									url: global.params.marker.imagesFolder + markerIcon.fileName,
									size: new google.maps.Size( markerIcon.width, markerIcon.height ),
									scaledSize: new google.maps.Size( markerIcon.width, markerIcon.height ),
									origin: new google.maps.Point( 0, 0 ),
									anchor: new google.maps.Point( markerIcon.width / 2, markerIcon.height / 2 )
								}

								let currentMarkerOptions = global.params.currentMarkerOptions;
								currentMarkerOptions["map"] = map;
								currentMarkerOptions["position"] = latLng;
								currentMarkerOptions["icon"] = icon;
								currentMarker.push( new google.maps.Marker( currentMarkerOptions ) );
							}

							if( global.params.setCurrentLg && !$.fn.functions.getLocalGovernmentVal() && firstPosLoad ) reverseGeocodingAndSetLg( latLng );

							if( !trackingMapSwipe ) map.panTo( latLng );
							if( !trackingMapZoom ) map.setZoom( global.params.currentZoomLevel );

							firstPosLoad = false;
						},
						function( error ){ // 現在地取得に失敗した場合の関数
							$.fn.functions.showErrorDialog(1.2);
							$.fn.maps.removeSearchMarker();
							$.fn.maps.clearWatchPosition();
						},
						{ // [第3引数] オプション
							"enableHighAccuracy": false,
							"timeout": 8000,
							"maximumAge": 2000,
						}
					));
				}
			} else { // Geolocation APIに対応していない場合
				$.fn.functions.showErrorDialog(1.1);
			}
		}

		$.fn.maps.removeMarkers = function() { // マップからマーカーを一括撤去する
			if ( Object.keys( markers ).length ) {
				for( var key in markers ) {
					markers[key].setMap( null );
				}
				markers = {};
				markersLoaded = {};
				infoWindows = [];
				mapFitBounds = {};
			}
		}

		$.fn.maps.removeGyoseiKukaku = function() { // 市町村エリアの描画を撤去する
			for( var i = 0; i < gyoseiKukakus.length; i++ ) {
				gyoseiKukakus[i].setMap( null );
			}
			gyoseiKukakus = [];
		}

		$.fn.maps.removeSearchMarker = function() { // 検索マーカーを撤去する
			for( var marker = 0; marker < searchMarker.length; marker++ ) {
				searchMarker[marker].setMap( null );
			}
			searchMarker = [];
			currentPos = [];
		}

		$.fn.maps.clearWatchPosition = function() { // wathPositionのイベントをクリアする
			for( var position = 0; position < watchPosition.length; position++ ) {
				navigator.geolocation.clearWatch( watchPosition[position] );
			}
			watchPosition = [];
		}


		/* --------------------------------------
		   private 関数の宣言
		----------------------------------------- */

		function setMap( mapCenter, zoomLevel, addMarker ) { // マップをセット、併せてマップのイベント設定

			const mapObj = document.getElementById( $.fn.functions.trimHashId( global.params.mapEleId ) );
			let mapOptions = global.params.mapOptions;
			mapOptions["center"] = mapCenter;
			mapOptions["zoom"] = zoomLevel;
			mapOptions["mapTypeId"] = google.maps.MapTypeId.ROADMAP;

			map = new google.maps.Map( mapObj, mapOptions );

			if( addMarker ) {
				let markerIcon = global.params.marker.imageFile.point;
				if( $.fn.functions.isSmartDevice() ) {
					markerIcon = markerIcon.high
				} else {
					markerIcon = markerIcon.row
				}

				let icon = {
					url: global.params.marker.imagesFolder + markerIcon.fileName,
					size: new google.maps.Size( markerIcon.width, markerIcon.height ),
					scaledSize: new google.maps.Size( markerIcon.width, markerIcon.height ),
					origin: new google.maps.Point( 0, 0 ),
					anchor: new google.maps.Point( markerIcon.width / 2, markerIcon.height )
				}

				let searchMarkerOptions = global.params.searchMarkerOptions;
				searchMarkerOptions["map"] = map;
				searchMarkerOptions["icon"] = icon;
				searchMarkerOptions["position"] = mapCenter;

				searchMarker.push( new google.maps.Marker( searchMarkerOptions ) );
				if( !global.params.localGovernment ) reverseGeocodingAndSetLg( mapCenter );
			}

			addSearchEvent( map );
			addCurrentBtn( map );

			google.maps.event.addListener( map, 'click', function( event ) {
				closeInfoWindow();
			});

			google.maps.event.addListener(map, 'dragstart', function() {
				trackingMapSwipe = true;
			});

			google.maps.event.addListener(map, 'zoom_changed', function() {
				trackingMapZoom = true;
			});

			if( global.params.address ) {
				$.fn.data.loadShisetsuData( true, false, $.fn.maps.createMarkers );
			} else {
				$.fn.data.loadShisetsuData( true, true, $.fn.maps.createMarkers );
			}
		}

		function codeAddress( japaneseAddress, addMarker ) { // 初期座標の指定がない場合、日本語住所から経度緯度に変換し、マップをセットする関数へつなぐ

			geocoder = new google.maps.Geocoder()

			return geocoder.geocode( { 'address': japaneseAddress, 'language': 'ja' }, function( places, status ) {
				if( status == google.maps.GeocoderStatus.OK ){
					const latLngArr = places[0].geometry.location.toUrlValue();
					const arrayLtLg = latLngArr.split(",");
					mapCenter["lat"] = Number( arrayLtLg[0] );
					mapCenter["lng"] = Number( arrayLtLg[1] );
					if( addMarker ) {
						setMap( mapCenter, global.params.addressZoomLevel, addMarker );
					} else {
						setMap( mapCenter, global.params.zoomLevel );
					}
				}
			});
		}

		function markerAddress( lGVal, time ,key, mapFit ) { // 施設の座標を指定していない場合、住所から座標を取得し、マーカー作成の関数へつなぐ

			let latLngArr = {};
			let arrayLtLg = {};

			markersLoaded[ String( lGVal + key ) ] = false;

			geocoder = new google.maps.Geocoder();

			return geocoder.geocode( { 'address': global.shisetsuData[lGVal][time][key]["所在地"], 'language': 'ja' }, function( places, status ) {
				if( status == google.maps.GeocoderStatus.OK ){
					latLngArr = places[0].geometry.location.toUrlValue();
					arrayLtLg = latLngArr.split(",");
					global.shisetsuData[lGVal][time][key]["緯度"] = Number( arrayLtLg[0] );
					global.shisetsuData[lGVal][time][key]["経度"] = Number( arrayLtLg[1] );
					checkFitBounds( global.shisetsuData[lGVal][time][key]["緯度"], global.shisetsuData[lGVal][time][key]["経度"] );
					createMarkerIcon( global.shisetsuData[lGVal][time][key], String( lGVal + key ) );
					markersLoaded[ String( lGVal + key ) ] = true;
					if( mapFit ) if( markersLoadedCheck() ) fitBounds( mapFitBounds ); // すべての読み込みが完了したら地図の表示範囲を調整
				} else {
					markersLoaded[ String( lGVal + key ) ] = true;
					console.log ( global.shisetsuData[lGVal][time][key]["施設名"] + "の座標の取得に失敗しました" );
				}
			});
		}

		function addSearchEvent( map ) { // 検索のイベント設定

			searchInput = document.getElementById( $.fn.functions.trimHashId( global.params.searchInputEleId ) );
			$( global.params.searchContainerId ).css( 'display', 'block' );

				if( global.params.searchAutoComplete ) { // 検索のオートコンプリートを使用する場合

				const searchContainer = document.getElementById( $.fn.functions.trimHashId( global.params.searchContainerId ) );
				map.controls[google.maps.ControlPosition.TOP_LEFT].push( searchContainer );

				const searchBox = new google.maps.places.SearchBox( searchInput );
				const autocomplete = new google.maps.places.Autocomplete( searchInput, global.params.searchOptions );

				google.maps.event.addListener( searchBox, 'bounds_changed', function( event ) {
					searchBox.setBounds( map.getBounds() );
				});

				google.maps.event.addListener( searchBox, 'places_changed', function( event ) {
					const places = searchBox.getPlaces();
					searchResult( places );
				});

			} else { // 検索のオートコンプリートを使用しない場合

				$( global.params.searchContainerId ).css( 'position', 'absolute' );

				geocoder = new google.maps.Geocoder();

				$( global.params.searchFormEleId ).submit( function() {
					return geocoder.geocode( { 'address': searchInput.value, 'language': 'ja' }, function( places, status ) {
						if( status == google.maps.GeocoderStatus.OK ) {
							searchResult( places );
						} else if( status == google.maps.GeocoderStatus.ZERO_RESULTS ) {
							$.fn.functions.showErrorDialog( 2.1 );
							return;
						}
					});
				});
			}
		}

		function searchResult( places ) {

			if ( places.length == 0 ) {
				$.fn.functions.showErrorDialog( 2.1 );
				return;
			}

			$.fn.maps.removeSearchMarker();
			$.fn.maps.clearWatchPosition();

			searchMarker = [];

			let bounds = new google.maps.LatLngBounds();

			for( var place in places ) {

				if( places.length == 1 ) { // 検索地点が１つに絞られる場合

					if ( !places[place].geometry ) {
						$.fn.functions.showErrorDialog( 2.2 );
						return;
					}

					let markerIcon = global.params.marker.imageFile.point;
					if( $.fn.functions.isSmartDevice() ) {
						markerIcon = markerIcon.high
					} else {
						markerIcon = markerIcon.row
					}

					let icon = {
						url: global.params.marker.imagesFolder + markerIcon.fileName,
						size: new google.maps.Size( markerIcon.width, markerIcon.height ),
						scaledSize: new google.maps.Size( markerIcon.width, markerIcon.height ),
						origin: new google.maps.Point( 0, 0 ),
						anchor: new google.maps.Point( markerIcon.width / 2, markerIcon.height )
					}

					const latLngArr = places[place].geometry.location.toUrlValue();
					const arrayLtLg = latLngArr.split(",");
					mapCenter["lat"] = Number( arrayLtLg[0] );
					mapCenter["lng"] = Number( arrayLtLg[1] );

					let searchMarkerOptions = global.params.searchMarkerOptions;
					searchMarkerOptions["map"] = map;
					searchMarkerOptions["icon"] = icon;
					searchMarkerOptions["position"] = mapCenter;

					searchMarker.push( new google.maps.Marker( searchMarkerOptions ) );
					$.fn.functions.addUrlQuerie( "address", searchInput.value );
					reverseGeocodingAndSetLg( mapCenter );

				} else {
					$.fn.functions.showErrorDialog( 2.2 );
					return;
				}

				if (places[place].geometry.viewport) {
					bounds.union(places[place].geometry.viewport);
				} else {
					bounds.extend(places[place].geometry.location);
				}
			};
			map.fitBounds( bounds );
		}

		function addCurrentBtn( map ) {
			const currentContainer = document.getElementById( $.fn.functions.trimHashId( global.params.currentContainerId ) );
			map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push( currentContainer );
			$( global.params.currentContainerId ).css( 'display', 'block' );
		}

		function reverseGeocodingAndSetLg( latLng ) { // 座標から市町村名を取得
			
			geocoder = new google.maps.Geocoder();

			if ( geocoder ) {
				geocoder.geocode({'latLng': latLng}, function( places, status ) {
					if ( status == google.maps.GeocoderStatus.OK ) {
						if ( places[1] ) {
							const regexp = new RegExp( '.*?[市町村]$', 'g' );
							for( var i = places[1].address_components.length - 1; i >= 0; i-- ) {
								let lg = places[1].address_components[i]["long_name"].match( regexp );
								if( lg ) {
									if( !$.fn.functions.setLocalGovernment( lg ) ) $.fn.functions.setLocalGovernment( lg );
									$.fn.data.loadShisetsuData( true, false, $.fn.maps.createMarkers );
									$.fn.maps.removeGyoseiKukaku();
									$.fn.maps.drawGyoseiKukaku( true, lg );
									break;
								}
							}
						}
					} else {
						console.log( status + "：自治体の取得に失敗しました。" );
					}
				});
			}
		}

		function closeInfoWindow( key ) { // フキダシを閉じる
			if ( key == null || key == -1 ) {
				if ( currentInfoWindow ) currentInfoWindow.close();
			} else {
				infoWindows[key].close();
			}
		}

		function removeCurrentMarker() {
			for( var marker = 0; marker < currentMarker.length; marker++ ) {
				currentMarker[marker].setMap(null);
			}
			currentMarker = [];
		}

		function fitBounds( mapFitBounds ) {
			let sw = new google.maps.LatLng( mapFitBounds.maxLat, mapFitBounds.minLng );
			let ne = new google.maps.LatLng( mapFitBounds.minLat, mapFitBounds.maxLng );
			let bounds = new google.maps.LatLngBounds( sw, ne );
			map.fitBounds( bounds, global.params.fitBoundsPadding );
			trackingMapSwipe = true;
			trackingMapZoom = true;
		}

		function drawArea( paths, drawOptions ) {
			drawOptions["paths"] = paths;
			const area = new google.maps.Polygon( drawOptions );
			area.setMap( map );
			return area;
		}

		function createMarkerIcon( shisetsu, lGValKey ) { // マーカーアイコンの作成
			if( getMarkerIcon( shisetsu ) ) {
				let markerIcon = getMarkerIcon( shisetsu );
				if( $.fn.functions.isSmartDevice() ) {
					markerIcon = markerIcon.high
				} else {
					markerIcon = markerIcon.row
				}

				let icon = {
					url: global.params.marker.imagesFolder + markerIcon.fileName,
					size: new google.maps.Size( markerIcon.width, markerIcon.height ),
					scaledSize: new google.maps.Size( markerIcon.width, markerIcon.height ),
					origin: new google.maps.Point( 0, 0 ),
					anchor: new google.maps.Point( markerIcon.width / 2, markerIcon.height )
				}

				markers[lGValKey] = new google.maps.Marker({ 
					position: {lat: shisetsu["緯度"], lng: shisetsu["経度"]},
					map: map,
					icon: icon
				});
				addMarkerEvent( shisetsu, lGValKey );
			}
		}

		function createMarkerInfoContent( shisetsu, lGValKey ) { // マーカー毎のインフォメーション作成
			const infoContent = getInfoContent( shisetsu, lGValKey );
			infoWindows[lGValKey] = new google.maps.InfoWindow({content: infoContent}); 
			infoWindows[lGValKey].addListener("closeclick", function( argument ) {
				closeInfoWindow();
			});
		}

		function addMarkerEvent( shisetsu, lGValKey ) { // マーカーのイベント設定
			markers[lGValKey].addListener('click', function() { // タップしたらフキダシを開く
				closeInfoWindow();
				createMarkerInfoContent( shisetsu, lGValKey );
				infoWindows[lGValKey].open( map, markers[lGValKey] ); 
				currentInfoWindow = infoWindows[lGValKey];
			});
		}

		function getMarkerIcon( shisetsu ) { // 施設の内容・状況に応じてマーカーアイコンのファイルパスを取得

			if( !isMatch( shisetsu ) ) return false;

			let category;
			const shisetsuCategory = getCategory( shisetsu );

			if( shisetsuCategory[0] && shisetsuCategory[1] ) {
				category = 0;
			} else if( shisetsuCategory[0] ) {
				category = 1;
			} else if( shisetsuCategory[1] ) {
				category = 2;
			} else {
				return false;
			}

			return global.params.marker.imageFile[category];
		}

		function isEnabled( shisetsu ) { // 空きなければfalseを返す

			// return true; // 確認用※運用時は消去

			let serviceCategory;

			if( !$.fn.functions.getServiceVals()[0] ) { // 年齢チェックボックスにチェックがない場合
				serviceCategory = global.params.shisetsuInfo.serviceCategory;
				for( var key in serviceCategory ) {
					if( shisetsu[serviceCategory[key]] > 0 && shisetsu[serviceCategory[key]] != null ) return true;
					if( $.fn.functions.isEnabledWord( shisetsu[serviceCategory[key]] ) ) return true;
				}
				return false;
			} else { // 年齢チェックボックスにチェックがある場合
				serviceCategory = $.fn.functions.getServiceVals();
				let judge = true;
				for( var key in serviceCategory ) {
					if( $.fn.functions.isNumber( shisetsu[serviceCategory[key]] ) ) {
						if( shisetsu[serviceCategory[key]] <=0 ) {
							judge = false;
							break;
						}
					} else if( shisetsu[serviceCategory[key]] != null ) {
						judge = false;
						if( $.fn.functions.isEnabledWord( shisetsu[serviceCategory[key]] ) ) judge = true;
						if( judge == false ) break;
					}
				}
				return judge;
			}
		}

		function isMatch( shisetsu ) { // 利用用途と合わなければfalseを返す

			let judge = true;

			if( $.fn.functions.getServiceVals()[0] ) { // 用途チェックボックスにチェックがある場合
				const serviceCategory = $.fn.functions.getServiceVals();
				for( var key in serviceCategory ) {
					if( $.fn.functions.isNumber( shisetsu[serviceCategory[key]] ) ) {
						if( shisetsu[serviceCategory[key]] <=0 ) {
							judge = false;
							break;
						}
					} else if( shisetsu[serviceCategory[key]] != null ) {
						judge = false;
						if( $.fn.functions.isEnabledWord( shisetsu[serviceCategory[key]] ) ) judge = true;
						if( judge == false ) break;
					}
				}
			}
			return judge;
		}

		function getCategory( shisetsu ) { // 施設のカテゴリー番号を配列で取得

			let category = {};

			const serviceCategory = global.params.shisetsuInfo.category;
			for( var key in serviceCategory ) {
				if( $.fn.functions.isEnabledWord( shisetsu[serviceCategory[key]] ) ) category[key] = true;
			}
			return category;
		}

		function checkFitBounds( lat, lng ) {
			if( !mapFitBounds.maxLat || mapFitBounds.maxLat < lat ) mapFitBounds.maxLat = lat;
			if( !mapFitBounds.minLat || mapFitBounds.minLat > lat ) mapFitBounds.minLat = lat;
			if( !mapFitBounds.maxLng || mapFitBounds.maxLng < lng ) mapFitBounds.maxLng = lng;
			if( !mapFitBounds.minLng || mapFitBounds.minLng > lng ) mapFitBounds.minLng = lng;
		}
		
		function markersLoadedCheck() { // ジオコーダーを利用したマーカーの読み込みがすべて完了したか確認
			let judge = true;
			for( let i = markersLoaded.length; i > 0; i-- ) {
				if( markersLoaded[i-1] == false ) {
					judge = false;
					break;
				}
			}
			return judge;
		}

		function getInfoContent( shisetsu, lGValKey ) { // フキダシのhtmlソースを返す

			let name = shisetsu["施設名"];
			let url = encodeURI( shisetsu["施設情報URL"] );

			let tel = shisetsu["電話番号"];
			if ( $.fn.functions.isSmartDevice() && $.fn.functions.isTel( tel ) ) tel = $.fn.functions.convertTelToAnchorTag( tel ); // スマートデバイスの場合電話番号をリンク化

			let uri;
			if( !$.fn.functions.isSmartDevice() && $( global.params.searchInputEleId ).val() ) {
				uri = getUriForGoogleKeiro( shisetsu["緯度"] + ',' + shisetsu["経度"], $( global.params.searchInputEleId ).val() );
			} else {
				uri = getUriForGoogleKeiro( shisetsu["施設名"] + '@' + shisetsu["緯度"] + ',' + shisetsu["経度"] );
			}
			const btn = '<a href="' + uri + '" target="_blank" class="uk-button uk-button-primary uk-button-small uk-width-1-1 uk-margin-small-top">経路 (Google)</a>';

			let telAndUrl = '';
			if( $.fn.functions.isTel( tel ) || $.fn.functions.isUrl( url ) ) {
				telAndUrl +=
					'<div class="tm-infowindow-content-body-part tel-url clearfix">';
			}
			if( $.fn.functions.isTel( tel ) ) {
				telAndUrl +=
					'<p class="uk-margin-remove-bottom">' +
					'<span uk-icon="icon: receiver; ratio: 0.8"></span>' +
					tel +
					'</p>';
			}
			if( $.fn.functions.isUrl( url ) ) {
				telAndUrl +=
					'<p class="uk-margin-remove-bottom">' +
					'<span uk-icon="icon: info; ratio: 0.8"></span>' +
					'<a href="' + url + '" target="_blank">施設情報</a>' +
					'</p>' +
					'</div>';
			} else if( $.fn.functions.isTel( tel ) ) {
				telAndUrl +=
					'</div>';
			}

			const content = 
				'<div class="uk-container tm-infowindow" id="infowindowcontent-' + lGValKey + '">' + 
				'<div class="tm-infowindow-content-body">' +
				'<h5 class="uk-h6 uk-margin-small-bottom">' + name + '</h5>' +
				'<div class="tm-infowindow-content-body-part">' +
				'<p class="uk-margin-remove-bottom">' +
				'<span class="uk-margin-medium-right">' + global.params.shisetsuInfo.category[0] + ' : ' + shisetsu["授乳スペース"] + '</span>' +
				'<span>' + global.params.shisetsuInfo.category[1] + ' : ' + shisetsu["おむつ替えスペース"] + '</span>' + 
				'</p>' +
				'</div>' +
				telAndUrl +
				'<div class="tm-infowindow-content-body-part">' +
				'<p class="uk-margin-remove-bottom">' +
				shisetsu["所在地"] +
				'</p>' +
				'</div>' +
				'<div class="uk-padding-remove-bottom tm-infowindow-content-body-part">' +
				'<p class="uk-margin-remove-bottom">' +
				"利用可能日: " + shisetsu["利用可能日"] + "<br>" +
				"利用可能時間: " + shisetsu["利用可能時間"] +
				'</p>' +
				'</div>' +
				'<div>' +
				btn +
				'</div>' +
				'</div>' +
				'</div>';

			return content;
		}

		function getUriForGoogleKeiro( address1, address2 ) {
			if( address2 ) return encodeURI( global.params.googleMaps.baseKeiroUri2.replace( "{address1}", address1 ).replace( "{address2}", address2 ) );
			return encodeURI( global.params.googleMaps.baseKeiroUri1.replace( "{address}", address1 ) );
		}
	}
})(jQuery);
