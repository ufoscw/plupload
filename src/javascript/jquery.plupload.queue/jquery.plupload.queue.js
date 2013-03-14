/**
 * jquery.plupload.queue.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

// JSLint defined globals
/*global plupload:false, jQuery:false, alert:false */

(function($) {
	var uploaders = {};

	function _(str) {
		return plupload.translate(str) || str;
	}

	function renderUI(id, target) {
		// Remove all existing non plupload items
		target.contents().each(function(i, node) {
			node = $(node);

			if (!node.is('.plupload')) {
				node.remove();
			}
		});
		
		var fileAreaHtml = 
			'<div class="fileArea"> ' +
				'<div id="' + id + '_container" class="fileAddArea fileCont"> ' +
					'<div class="fileAction"> ' +
						'<button class="chkBase" id="'+ id + '_selectAllBtn" type="button"><em class="blind">전체 다운로드</em></button> ' +
						'<button class="button05" id="'+ id + '_browse' + '" type="button"><span class="fileAdd">삽입</span></button> ' +
						'<span class="fileInfo"> ' +
							'<span class="total">총1개</span><span class="byte">50KB</span> ' +
						'</span> ' +
					'</div> ' +
					
					'<div class="fileFold"> ' +
						'<button id="'+ id + '_foldBtn" class="buttonImg hover fileunfold" type="button"><span class="blind">파일목록 펼치기</span></button> ' +
						'<button id="'+ id + '_unfoldBtn" class="buttonImg hover filefold blind" type="button"><span class="blind">파일목록 닫기</span></button> ' +
					'</div>' +
					
					'<div class="clfix" style="display:none;"> ' +
						'<div class="fileList fileList02"> ' +
							'<div class="btnCtl"> ' +
								'<button class="button08" type="button" id="'+ id + '_indexUpBtn"><span class="buttonCtl up">위</span></button> ' +
								'<button class="button08" type="button" id="'+ id + '_indexDownBtn"><span class="buttonCtl down">아래</span></button> ' +
								'<button class="button08 del" type="button" id="'+ id + '_delSelectedBtn"><span class="buttonCtl del">삭제</span></button> ' +
							'</div> ' +
							'<ul id="' + id + '_fileList"></ul> ' +
						'</div> ' +
					'</div> ' +
				'</div> ' +
				'<input type="hidden" id="' + id + '_count" name="' + id + '_count" value="0" />' +
			'</div>';
		
		//파일추가 버튼 외부지정시에는 버튼 빼기..
		if( uploaders[id].settings.browse_button == null ){
			target.prepend( fileAreaHtml );
		} else {
			var newHtml = $('<div/>').append($('#' + id + '_browse', fileAreaHtml).remove().end()).html();
			target.prepend( newHtml );
		}
		
	}
	
	$.fn.pluploadQueue = function(settings) {
		if (settings) {
			this.each(function() {
				var uploader, target, id;

				target = $(this);
				id = target.attr('id');

				if (!id) {
					id = plupload.guid();
					target.attr('id', id);
				}
				
				//Uploader 인스턴스 생성 및 파라미터 전달
				uploader = new plupload.Uploader($.extend({
					dragdrop : true,
					container : id
				}, settings));

				uploaders[id] = uploader;

				//파일상태에 따라 UI변경
				function handleStatus(file) {
					var actionClass;

					if (file.status == plupload.DONE) {
						actionClass = 'plupload_done';
					}

					if (file.status == plupload.FAILED) {
						actionClass = 'plupload_failed';
					}

					if (file.status == plupload.QUEUED) {
						actionClass = 'plupload_delete';
					}

					if (file.status == plupload.UPLOADING) {
						actionClass = 'plupload_uploading';
					}
					
					//기체크되어 있던 Item 체크박스 on
					if( file.selected == 1 ){
						$('#' + file.id).addClass('on');
					}
					
					//기업로드된 파일의 경우 파일 다운로드
					if (file.status == plupload.ALREADY_UPLOADED) {
						//핸드커서로 변경
						$('#' + file.id).css('cursor', 'pointer');
						
						$('#' + file.id).click(function(event){
							//기타컴퍼넌트 클릭시는 핸들링하지 않음
							if(event.target == event.currentTarget){
								var url = uploader.settings.downloadUrl + "?downloadType=multi&filePath=" + file.filePath;
								$.fileDownload(url, {
									successCallback: function (url) {
										console.log("Down Success! " + url);
									},
									failCallback: function (responseHtml, url) {
										console.log("Down Failed! " + url);
									}
								});
							}
						});
					}
				}

				//프로그레스 업데이트
				function updateTotalProgress() {
					$('span.plupload_total_status', target).html(uploader.total.percent + '%');
					$('div.plupload_progress_bar', target).css('width', uploader.total.percent + '%');
					$('span.plupload_upload_status', target).html(
						_('Uploaded %d/%d files').replace(/%d\/%d/, uploader.total.uploaded+'/'+uploader.files.length)
					);
				}
				
				function updateList() {
					var fileList = $('#' + id + '_fileList', target).html(''), inputCount = 0, inputHTML;
					
					//배열 목록이 존재하지 않으면 화면 숨기기
					if( uploader.files.length > 0){
						unFoldFileList(target);
					} else {
						foldFileList(target);
					}
					
					$.each(uploader.files, function(i, file) {
						inputHTML = '';

						if (file.status == plupload.DONE) {
							if (file.target_name) {
								inputHTML += '<input type="hidden" name="' + id + '_' + inputCount + '_tmpname" value="' + plupload.xmlEncode(file.target_name) + '" />';
							}

							inputHTML += '<input type="hidden" name="' + id + '_' + inputCount + '_name" value="' + plupload.xmlEncode(file.name) + '" />';
							inputHTML += '<input type="hidden" name="' + id + '_' + inputCount + '_status" value="' + (file.status == plupload.DONE ? 'done' : 'failed') + '" />';
	
							inputCount++;

							$('#' + id + '_count').val(inputCount);
						}

						fileList.append(
							'<li id="' + file.id + '"> ' +
								'<button class="chkBase" type="button"><em class="blind">선택</em></button> ' +
								'<em class="icoFile ' + getFileTypeIco(file.name) + '"></em> ' +
								file.name + '<em class="byte"> (' + cmafAddCommas(Math.round(file.size / 1024, 1)) + 'KB)</em> ' +
								'<button class="button" type="button" id="' + file.id + '_deleteBtn"><span class="buttonImg del04"><em class="blind">삭제</em></span></button> ' +
								inputHTML +
							'</li>'
						);
						
						handleStatus(file);
						
						//삭제버튼 이벤트핸들러
						$('#' + file.id + '_deleteBtn').click(function(e) {
							uploader.removeFile(file);
							e.preventDefault();
						});
						
						//체크박스 이벤트핸들러
						$('#' + file.id + ' > .chkBase').click(function(e) {
							//체크상태 갱신하고..
							$('#' + file.id ).toggleClass('on');
							
							//selected 속성값 변경하기
							file.selected = $('#' + file.id ).hasClass('on') ? 1 : 0;
							
							//전체선택 상태도 갱신
							refreshAllSelectStatus(target);
							
							e.preventDefault();
						});
					});
					
					var totalSize = 0;
					$.each(uploader.files,function(index,value){
						totalSize += value.size;
					});
					$('span.total', target).html("총" + uploader.files.length + "개");
					$('span.byte', target).html(cmafAddCommas(Math.round(totalSize / 1024, 1)) + 'KB');

					$('a.plupload_start', target).toggleClass('plupload_disabled', uploader.files.length == (uploader.total.uploaded + uploader.total.failed + uploader.total.alreadyUploaded));

					// Scroll to end of file list
					fileList[0].scrollTop = fileList[0].scrollHeight;

					updateTotalProgress();

					//전체선택 상태도 갱신
					refreshAllSelectStatus(target);
					
					// Re-add drag message if there is no files
//					if (!uploader.files.length && uploader.features.dragdrop && uploader.settings.dragdrop) {
//						$('#' + id + '_fileList').append('<li class="plupload_droptext">' + _("Drag files here.") + '</li>');
//					}
				}
				
				//전체선택 상태 갱신
				function refreshAllSelectStatus(target){
					if($('#' + id + '_fileList li', target).length == 0){
						$('#' + id + '_selectAllBtn', target).removeClass('on');
						return;
					}
					
					var selectedAll = $('#' + id + '_fileList li', target).filter('.on').length == $('#' + id + '_fileList li', target).length;
					if(selectedAll){
						$('#' + id + '_selectAllBtn', target).addClass('on');
					} else {
						$('#' + id + '_selectAllBtn', target).removeClass('on');
					}
				}

				//첨부파일 아이콘 Class 가져오기
				function getFileTypeIco(fileName){
					return 'icoPpt';
				}

				//첨부파일 사이즈 텍스트 생성
				function cmafGetFileSize(fileSize){
					var fileSizeStr = "(";
					fileSizeStr += fileSize == null ? 0 : cmafAddCommas(fileSize);
					fileSizeStr += "KB)";
					return fileSizeStr;
				}

				//전체선택 클릭 핸들러
				function selectAllToggle(target){
					//토글모드 결정하기
					if( $('#' + id + '_selectAllBtn', target).hasClass('on') ){
						$('#' + id + '_selectAllBtn', target).removeClass('on');
						$('#' + id + '_fileList li', target).removeClass('on');
					} else {
						$('#' + id + '_selectAllBtn', target).addClass('on');
						$('#' + id + '_fileList li', target).addClass('on');
					}
				}

				//접기버튼 클릭 핸들러
				function foldFileList(target){
					$('#' + id + '_foldBtn', target).addClass('blind');
					$('#' + id + '_unfoldBtn', target).removeClass('blind');
					$('.clfix', target).hide();
				}

				//펼치기버튼 클릭 핸들러
				function unFoldFileList(target){
					$('#' + id + '_foldBtn', target).removeClass('blind');
					$('#' + id + '_unfoldBtn', target).addClass('blind');
					$('.clfix', target).show();
				}
				
				function updateFileIndex(){
					//uploader 파일정보에서 인덱스 갱신하기..
					uploader.files.sort(function(a,b){
						var aIndex = $('#' + id + '_fileList li', target).index($('#' + id + '_fileList li#' + a.id, target));
						var bIndex = $('#' + id + '_fileList li', target).index($('#' + id + '_fileList li#' + b.id, target));
						if(aIndex == bIndex){
							return 0;
						} else if( aIndex > bIndex ){
							return 1;
						} else {
							return -1;
						}
					});
				}
				
				uploader.bind("UploadFile", function(up, file) {
					$('#' + file.id).addClass('plupload_current_file');
				});

				uploader.bind('Init', function(up, res) {
					renderUI(id, target);

					// Enable rename support
					if (!settings.unique_names && settings.rename) {
						target.on('click', '#' + id + '_fileList div.plupload_file_name span', function(e) {
							var targetSpan = $(e.target), file, parts, name, ext = "";


							// Get file name and split out name and extension
							file = up.getFile(targetSpan.parents('li')[0].id);
							name = file.name;
							parts = /^(.+)(\.[^.]+)$/.exec(name);
							if (parts) {
								name = parts[1];
								ext = parts[2];
							}


							// Display input element
							targetSpan.hide().after('<input type="text" />');
							targetSpan.next().val(name).focus().blur(function() {
								targetSpan.show().next().remove();
							}).keydown(function(e) {
								var targetInput = $(this);


								if (e.keyCode == 13) {
									e.preventDefault();


									// Rename file and glue extension back on
									file.name = targetInput.val() + ext;
									targetSpan.html(file.name);
									targetInput.blur();
								}
							});
						});
					}

					//파일 첨부버튼 ID 생성
					if( up.settings.browse_button == null ){
						up.settings.browse_button = id + '_browse';
					}

					// Enable drag/drop
					if (up.settings.dragdrop && up.features.dragdrop) {
						up.settings.drop_element = id + '_fileDragDrop';
						target.append(
							'<div class="fileAddCont" id="' + id + '_fileDragDrop">' +
								'<div class="fileAddContB">' +
									'<span class="fileAddIco"></span><span class="fileTxt">첨부할 파일을 여기 올려주세요.</span>' +
								'</div>' +
								'<br />' +
							'</div>'
						);
						
//						//DragOver 이벤트 핸들러(임시주석처리)
//						var dragOutFuncId = null;
//						$(window).bind('dragover',function(){
//							//기존 timer는 초기화
//							window.clearTimeout(dragOutFuncId);
//							
//							//사이즈를 늘리고
//							$('#' + id + '_fileDragDrop .fileAddContB').addClass('drag');
//							
//							//사이즈 원복 타이머 초기화
//							dragOutFuncId = window.setTimeout(function(){
//								$('#' + id + '_fileDragDrop .fileAddContB').removeClass('drag');
//							}, 100);
//						});
					}

					$('#' + id + '_container').attr('title', 'Using runtime: ' + res.runtime);

					//전체선택
					$('#' + id + '_selectAllBtn', target).click(function(){
						selectAllToggle(target);
						$.each(uploader.files, function(index,value){
							value.selected = $('#' + value.id, target ).hasClass('on') ? 1 : 0;
						});
					});
					
					//접기버튼
					$('#' + id + '_foldBtn', target).click(function(){
						foldFileList(target);
					});
					//펴기
					$('#' + id + '_unfoldBtn', target).click(function(){
						if(uploader.files.length > 0){
							unFoldFileList(target);
						}
					});
					
					//인덱스(위로)
					$('#' + id + '_indexUpBtn', target).click(function(){
						var selectedItems = $('#' + id + '_fileList li.on', target);
						if( selectedItems.length > 0 ){
							//이동가능한지 확인
							//첫번째 선택된 아이템의 index가 0이면 리턴
							if($('#' + id + '_fileList li', target).index(selectedItems[0]) == 0){
								return;
							}
							$.each(selectedItems, function(i, currItem){
								var prevItem = $(currItem).prev();
								$(prevItem).before(currItem);
								
								//첫번째 아이템이 스크롤바를 넘어가면 스크롤바를 위로
								if( i == 0 ){
									var currItemTop = $(currItem).position().top - $('#' + id + '_fileList', target).position().top;
									var scrollDiv = $('.clfix', target).scrollTop();
									
									if( scrollDiv > currItemTop ){
										$('.clfix', target).scrollTop(currItemTop);
									}
								}
								
								//uploader 파일정보에서 인덱스 갱신하기..
								updateFileIndex();
							});
						} else {
							alert("이동할 항목을 선택해주세요.");
						}
					});
					
					//인덱스(아래로)
					$('#' + id + '_indexDownBtn', target).click(function(){
						var selectedItems = $('#' + id + '_fileList li.on', target);
						if( selectedItems.length > 0 ){
							//마지막 선택된 아이템의 index가 마지막이면 리턴
							if($('#' + id + '_fileList li', target).index(selectedItems[selectedItems.length-1]) == $('#' + id + '_fileList li', target).length-1){
								return;
							}
							for(var i = 0; i < selectedItems.length; ++i){
								var currItem = selectedItems[selectedItems.length - i - 1];
								var nextItem = $(currItem).next();
								$(nextItem).after(currItem);
								
								//마지막 아이템이 스크롤바를 넘어가면 스크롤바를 아래로
								if( i == 0){
									var currItemBottom = $(currItem).position().top - $('#' + id + '_fileList', target).position().top + $(currItem).height();
									var scrollDiv = $('.clfix', target).scrollTop();
									
									if( $('.clfix', target).height() + scrollDiv < currItemBottom ){
										$('.clfix', target).scrollTop(currItemBottom - $('.clfix', target).height());
									}
								}
								
							};
							
							//uploader 파일정보에서 인덱스 갱신하기..
							updateFileIndex();
						} else {
							alert("이동할 항목을 선택해주세요.");
						}
					});
					
					//선택 삭제
					$('#' + id + '_delSelectedBtn', target).click(function(){
						var selectedItems = $('#' + id + '_fileList li.on', target);
						if( selectedItems.length > 0 ){
							var selectedFileIds = [];
							$.each($('#' + id + '_fileList li.on', target),function(index, value){
								selectedFileIds.push(value.id);
							});
							uploader.removeFilesByIds(selectedFileIds);
						} else {
							alert("삭제할 항목을 선택해주세요.");
						}
					});
					
					
					$('a.plupload_start', target).click(function(e) {
						if (!$(this).hasClass('plupload_disabled')) {
							uploader.start();
						}
						e.preventDefault();
					});

					$('a.plupload_stop', target).click(function(e) {
						e.preventDefault();
						uploader.stop();
					});

					$('a.plupload_start', target).addClass('plupload_disabled');
				});

				uploader.bind("PostInit", function(up) {
					// features are populated only after input components are fully instantiated
//					if (up.settings.dragdrop && up.features.dragdrop) {
//						$('#' + id + '_fileList').append('<li class="plupload_droptext">' + _("Drag files here.") + '</li>');
//					}
				});

				
				uploader.init();

				uploader.bind("Error", function(up, err) {
					up.stop();
					
					var file = err.file, message;

					if (file) {
						message = err.message;

						if (err.details) {
							message += " (" + err.details + ")";
						}

						if (err.code == plupload.FILE_SIZE_ERROR) {
							alert(_("Error: File too large:") + " " + file.name);
						} else if (err.code == plupload.FILE_TOTAL_SIZE_ERROR) {
							alert(_("Error: Total Files too large:") + " " + file.name);
						} else if (err.code == plupload.FILE_EXTENSION_ERROR) {
							alert(_("Error: Invalid file extension:") + " " + file.name);
						} else {
							alert( "Error: " + err.message + "(" + err.code + ") " + file.name);
						}

						file.hint = message;
						$('#' + file.id).attr('class', 'plupload_failed').find('a').css('display', 'block').attr('title', message);
					}
				});

				uploader.bind('StateChanged', function() {
					if (uploader.state === plupload.STARTED) {
						$('li.plupload_delete a,div.plupload_buttons', target).hide();
						$('span.plupload_upload_status,div.plupload_progress,a.plupload_stop', target).css('display', 'block');
						$('span.plupload_upload_status', target).text('Uploaded ' + (uploader.total.uploaded + uploader.total.alreadyUploaded ) + '/' + uploader.files.length + ' files');

						if (settings.multiple_queues) {
							$('span.plupload_total_status', target).show();
						}
					} else {
						updateList();
						$('a.plupload_stop,div.plupload_progress', target).hide();
						$('a.plupload_delete', target).css('display', 'block');
					}
				});

				uploader.bind('QueueChanged', updateList);

				uploader.bind('FileUploaded', function(up, file) {
					handleStatus(file);
				});

				uploader.bind("UploadProgress", function(up, file) {
					// Set file specific progress
					$('#' + file.id + ' div.plupload_file_status', target).html(file.percent + '%');

					handleStatus(file);
					updateTotalProgress();

					if (settings.multiple_queues && uploader.total.alreadyUploaded + uploader.total.uploaded + uploader.total.failed == uploader.files.length) {
						$('.plupload_buttons,.plupload_upload_status', target).css("display", "inline");
						$('.plupload_start', target).addClass("plupload_disabled");
						$('span.plupload_total_status', target).hide();
					}
				});

				// Call setup function
				if (settings.setup) {
					settings.setup(uploader);
				}
			});

			return this;
		} else {
			// Get uploader instance for specified element
			return uploaders[$(this[0]).attr('id')];
		}
	};
})(jQuery);
