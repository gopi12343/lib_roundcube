/* {[The file is published on the basis of MIT License]} */
window.rcmail && rcmail.addEventListener('init', function (evt) {
		window.crm = getCrmWindow();
		loadActionBar();
		rcmail.env.message_commands.push('yetiforce.importICS');
		rcmail.register_command('yetiforce.importICS', function (ics, element, e) {
			window.crm.AppConnector.request({
				async: true,
				dataType: 'json',
				data: {
					module: 'Calendar',
					action: 'ImportICS',
					ics: ics
				}
			}).done(function (response) {
				window.crm.Vtiger_Helper_Js.showPnotify({
					text: response['result'],
					type: 'info',
					animation: 'show'
				});
				$(element).closest('.icalattachments').remove();
			})
		}, true);
	}
);

function loadActionBar() {
	var content = $('#ytActionBarContent');
	var params = {
		module: 'OSSMail',
		view: 'MailActionBar',
		uid: rcmail.env.uid,
		folder: rcmail.env.mailbox,
		rcId: rcmail.env.user_id
	};
	window.crm.AppConnector.request(params).done(function (response) {
		content.find('.ytHeader').html(response);
		$('#messagecontent').css('top', (content.outerHeight() + $('#messageheader').outerHeight()) + 'px');
		registerEvents(content);
	});
}

function registerEvents(content) {
	registerAddRecord(content);
	registerAddReletedRecord(content);
	registerSelectRecord(content);
	registerRemoveRecord(content);
	registerImportMail(content);

	var block = content.find('.ytHeader .js-data');
	content.find('.hideBtn').click(function () {
		var button = $(this);
		var icon = button.find('.glyphicon');

		if (button.data('type') == '0') {
			button.data('type', '1');
			icon.removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
		} else {
			button.data('type', '0');
			icon.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
		}
		block.toggle();
		$(window).trigger("resize");
	});
}

function registerImportMail(content) {
	content.find('.importMail').click(function (e) {
		window.crm.Vtiger_Helper_Js.showPnotify({
			text: window.crm.app.vtranslate('StartedDownloadingEmail'),
			type: 'info'
		});
		window.crm.AppConnector.request({
			module: 'OSSMail',
			action: 'ImportMail',
			params: {
				uid: rcmail.env.uid,
				folder: rcmail.env.mailbox,
				rcId: rcmail.env.user_id
			}
		}).done(function (data) {
			loadActionBar();
			window.crm.Vtiger_Helper_Js.showPnotify({
				text: window.crm.app.vtranslate('AddFindEmailInRecord'),
				type: 'success'
			});
		})
	});
}

function registerRemoveRecord(content) {
	content.find('button.removeRecord').click(function (e) {
		var row = $(e.currentTarget).closest('.rowRelatedRecord');
		removeRecord(row.data('id'));
	});
}

function registerSelectRecord(content) {
	let id = content.find('#mailActionBarID').val();
	content.find('button.selectRecord').click(function (e) {
		let relParams = {
			mailId: id
		};
		if ($(this).data('type') == 0) {
			var module = $(this).closest('.js-head-container').find('.module').val();
		} else {
			var module = $(this).data('module');
			relParams.crmid = $(this).closest('.rowRelatedRecord').data('id');
			relParams.mod = $(this).closest('.rowRelatedRecord').data('module');
			relParams.newModule = module;
		}
		showPopup({
			module: module,
			src_module: 'OSSMailView',
			src_record: id,
		}, relParams);
	});
}

function registerAddReletedRecord(content) {
	var id = content.find('#mailActionBarID').val();
	content.find('button.addRelatedRecord').click(function (e) {
		var targetElement = $(e.currentTarget);
		var row = targetElement.closest('.rowRelatedRecord');
		var params = {sourceModule: row.data('module')};
		showQuickCreateForm(targetElement.data('module'), row.data('id'), params);
	});
}

function registerAddRecord(content) {
	var id = content.find('#mailActionBarID').val();
	content.find('button.addRecord').click(function (e) {
		var col = $(e.currentTarget).closest('.js-head-container');
		showQuickCreateForm(col.find('.module').val(), id);
	});
}

function removeRecord(crmid) {
	var id = $('#mailActionBarID').val();
	var params = {}
	params.data = {
		module: 'OSSMail',
		action: 'ExecuteActions',
		mode: 'removeRelated',
		params: {
			mailId: id,
			crmid: crmid
		}
	}
	params.async = false;
	params.dataType = 'json';
	window.crm.AppConnector.request(params).done(function (data) {
		var response = data['result'];
		if (response['success']) {
			var notifyParams = {
				text: response['data'],
				type: 'info',
				animation: 'show'
			};
		} else {
			var notifyParams = {
				text: response['data'],
				animation: 'show'
			};
		}
		window.crm.Vtiger_Helper_Js.showPnotify(notifyParams);
		loadActionBar();
	});
}

function showPopup(params, actionsParams) {
	actionsParams['newModule'] = params['module'];
	window.crm.app.showRecordsList(params, (modal, instance) => {
		instance.setSelectEvent((responseData, e) => {
			actionsParams['newCrmId'] = responseData.id;
			window.crm.AppConnector.request({
				async: false,
				dataType: 'json',
				data: {
					module: 'OSSMail',
					action: 'ExecuteActions',
					mode: 'addRelated',
					params: actionsParams
				}
			}).done(function (data) {
				let response = data['result'];
				if (response['success']) {
					var notifyParams = {
						text: response['data'],
						type: 'info',
						animation: 'show'
					};
				} else {
					var notifyParams = {
						text: response['data'],
						animation: 'show'
					};
				}
				window.crm.Vtiger_Helper_Js.showPnotify(notifyParams);
				loadActionBar();
			});
		});
	});
}

function showQuickCreateForm(moduleName, record, params) {
	var content = $('#ytActionBarContent');
	if (params == undefined) {
		var params = {};
	}
	var relatedParams = {};
	if (params['sourceModule']) {
		var sourceModule = params['sourceModule'];
	} else {
		var sourceModule = 'OSSMailView';
	}
	var postShown = function (data) {
		var index, queryParam, queryParamComponents;
		$('<input type="hidden" name="sourceModule" value="' + sourceModule + '" />').appendTo(data);
		$('<input type="hidden" name="sourceRecord" value="' + record + '" />').appendTo(data);
		$('<input type="hidden" name="relationOperation" value="true" />').appendTo(data);
	}
	var ids = {
		link: 'modulesLevel0',
		process: 'modulesLevel1',
		subprocess: 'modulesLevel2',
		linkextend: 'modulesLevel3'
	};
	for (var i in ids) {
		var element = content.find('#' + ids[i]);
		var value = element.length ? JSON.parse(element.val()) : [];
		if ($.inArray(sourceModule, value) >= 0) {
			relatedParams[i] = record;
		}
	}
	if (moduleName == 'Leads') {
		relatedParams['company'] = rcmail.env.fromName;
	}
	if (moduleName == 'Leads' || moduleName == 'Contacts') {
		relatedParams['lastname'] = rcmail.env.fromName;
	}
	if (moduleName == 'Project') {
		relatedParams['projectname'] = rcmail.env.subject;
	}
	if (moduleName == 'HelpDesk') {
		relatedParams['ticket_title'] = rcmail.env.subject;
	}
	if (moduleName == 'Products') {
		relatedParams['productname'] = rcmail.env.subject;
	}
	if (moduleName == 'Services') {
		relatedParams['servicename'] = rcmail.env.subject;
	}
	relatedParams['email'] = rcmail.env.fromMail;
	relatedParams['email1'] = rcmail.env.fromMail;
	relatedParams['description'] = $('#messagebody').text();
	//relatedParams['related_to'] = record;
	var postQuickCreate = function (data) {
		loadActionBar();
	}
	relatedParams['sourceModule'] = sourceModule;
	relatedParams['sourceRecord'] = record;
	relatedParams['relationOperation'] = true;
	var quickCreateParams = {
		callbackFunction: postQuickCreate,
		callbackPostShown: postShown,
		data: relatedParams,
		noCache: true
	};
	var headerInstance = new window.crm.Vtiger_Header_Js();
	headerInstance.quickCreateModule(moduleName, quickCreateParams);
}

function getCrmWindow() {
	if (opener !== null && opener.parent.CONFIG == "object") {
		return opener.parent;
	} else if (typeof parent.CONFIG == "object") {
		return parent;
	} else if (typeof parent.parent.CONFIG == "object") {
		return parent.parent;
	} else if (typeof opener.crm.CONFIG == "object") {
		return opener.crm;
	}
	return false;
}
