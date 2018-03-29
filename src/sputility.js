/*
   Name: SPUtility.js
   Version: 0.14.2
   Built: 2016-04-19
   Author: Kit Menke
   https://sputility.codeplex.com/
   Copyright (c) 2016
   License: The MIT License (MIT)
*/
/*
   Version 0.14.4
   Built: 2017-05-11
*/
// Object.create shim for class inheritance
if (!Object.create) {
   Object.create = function (o) {
		if (arguments.length > 1) {
			throw new Error('Object.create implementation only accepts the first parameter.');
		}
		function F() {}
		F.prototype = o;
		return new F();
	};
}

// Export SPUtility global variable
var SPUtility = (function ($) {
   "use strict";

   /*
	*   SPUtility Private Variables
   **/
   var _fieldsHashtable = null, // stores all fields by display name
	  _internalNamesHashtable = null, // stores all fields by internal name
	  _isDispForm = null, // whether or not current form is the display form
	  _spVersion = 12,    // current sharepoint version
	  _settings = {                 // DEFAULT SETTINGS:
		 'timeFormat': '12HR',      // 12HR or 24HR
		 'dateSeparator': '/',      // separates month/day/year with / or .
		 'dateFormat': 'MM/dd/yyyy', //format for only date
		 'dateTimeFormat': 'MM/dd/yyyy HH:mm:ss', //format for date with time
		 'decimalSeparator': '.',   // separates decimal from number
		 'thousandsSeparator': ',', // separates thousands in number
		 'stringYes': 'Yes',        // Text for when boolean field is True
		 'stringNo': 'No',           // Text for when boolean field is False
		 'termSeparator': ';',      // separates terms
		 'termLabelSeparator': '|'  // separates term from guid
	  };

   /*
	*   SPUtility Private Methods
   **/
	function isDispForm() {
		if (_isDispForm === null) {
			_isDispForm = $("table.ms-formtoolbar input[value='Close']").length >= 1;
		}
		return _isDispForm;
	}

	function isInternetExplorer() {
		return navigator.userAgent.toLowerCase().indexOf('msie') >= 0;
	}

	function isUndefined(obj) {
		return typeof obj === 'undefined';
	}

	function isString(obj) {
		return typeof obj === 'string';
	}

	function isNumber(obj) {
		return typeof obj === 'number';
	}

	function getInteger(str) {
		return parseInt(str, 10);
	}

	// escapeRegExp and replaceAll from http://stackoverflow.com/a/1144788/98933
	function escapeRegExp(str) {
		return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}

	function replaceAll(str, find, replace) {
		return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
	}

	function convertStringToNumber(val) {
		if (typeof val === "string") {
			// remove all thousands separators including spaces
			val = replaceAll(val, ' ', '');
			val = replaceAll(val, _settings['thousandsSeparator'], '');
			// replace the first instance of the decimal separator
			val = val.replace(_settings['decimalSeparator'], '.');
			val = parseFloat(val);
		}
		return val;
	}

	function htmlEscape(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/''/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	function paddingLeft(s, p, l){
		if (s.length >= l) { return s; }
		while (s.length < l) {
			s = p + s;
		}
		return s;
	}

	function is2013() {
		return _spVersion === 15;
	}

	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/number/fmt-money [rev. #2]
	// Modified to pass JSLint
	// n = the number to format
	// c = # of floating point decimal places, default 2
	// d = decimal separator, default "."
	// t = thousands separator, default ","
	function formatMoney(n, c, d, t) {
		c = (isNaN(c = Math.abs(c)) ? 2 : c);
		d = (d === undefined ? _settings['decimalSeparator'] : d);
		t = (t === undefined ? _settings['thousandsSeparator'] : t);
		var s = (n < 0 ? "-" : ""),
			i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10) + "",
			j = (j = i.length) > 3 ? j % 3 : 0;
		return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
	}
	
	function formatDate(d, f){
		if (typeof d.format === 'function') {
			return d.format(f);
		} else {
			var longMonthsInYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			var daysInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
			var fs = f.split('');
			var start = 0;
			var end = f.length - 1;
			var pattern = [];
		
			fs.forEach(function(i, j){
				if (j === 0) { return; }
				if (fs[j-1] === i) {
					if (j === end) { pattern.push(f.substr(start)); }
				} else {
					pattern.push(f.substr(start, j - start));
					start = j;
				}
			});
		
			var year = d.getFullYear();
			var month = d.getMonth();
			var day = d.getDate();
			var week = d.getDay();
			var hour = d.getHours();
			var minute = d.getMinutes();
			var second = d.getSeconds();
			var millsecond = paddingLeft(String(d.getMilliseconds()), '0', 7);

			var formated = pattern.map(function(s){
				switch (s) {
					case 'y': return String(+(String(year).slice(-2)));
					case 'yy': return String(year).slice(-2);
					case 'yyy': return String(year).slice(-3);
					case 'yyyy': return String(year).slice(-4);
					case 'M': return String(month + 1);
					case 'MM': return paddingLeft(String(month + 1), '0', 2);
					case 'MMM': return longMonthsInYear[month].slice(0, 3);
					case 'MMMM': return longMonthsInYear[month];
					case 'd': return String(day);
					case 'dd': return paddingLeft(String(day), '0', 2);
					case 'ddd': return daysInWeek[week].slice(0, 3);
					case 'dddd':return daysInWeek[week];
					case 'h': return String(hour > 12 ? (hour - 12) : hour);
					case 'hh':return paddingLeft(String(hour > 12 ? (hour - 12) : hour), '0', 2);
					case 'H':return String(hour);
					case 'HH':return paddingLeft(String(hour), '0', 2);
					case 'm': return String(minute);
					case 'mm': return paddingLeft(String(minute), '0', 2);
					case 's': return String(second);
					case 'ss': return paddingLeft(String(second), '0', 2);
					case 'f': return millsecond.slice(0, 1);
					case 'ff': return millsecond.slice(0, 2);
					case 'fff': return millsecond.slice(0, 3);
					case 'ffff': return millsecond.slice(0, 4);
					case 'fffff': return millsecond.slice(0, 5);
					case 'ffffff': return millsecond.slice(0, 6);
					case 'fffffff': return millsecond.slice(0, 7);
					case 'F': return millsecond.slice(0, 1) === '0' ? '' : millsecond.slice(0, 1);
					case 'FF': return +(millsecond.slice(0, 2)) === 0 ? '' : (+(millsecond.slice(0, 2)));
					case 'FFF': return +(millsecond.slice(0, 3)) === 0 ? '' : (+(millsecond.slice(0, 3)));
					case 'FFFF': return +(millsecond.slice(0, 4)) === 0 ? '' : (+(millsecond.slice(0, 4)));
					case 'FFFFF': return +(millsecond.slice(0, 5)) === 0 ? '' : (+(millsecond.slice(0, 5)));
					case 'FFFFFF': return +(millsecond.slice(0, 6)) === 0 ? '' : (+(millsecond.slice(0, 6)));
					case 'FFFFFFF': return +(millsecond.slice(0, 7)) === 0 ? '' : (+(millsecond.slice(0, 7)));
					default: return s;
				}
			});
			return formated.join('');
		}
	}

	function formatByRegion(d){
		var culture = typeof _spPageContextInfo === 'object' ? _spPageContextInfo.currentCultureName : 'en-US';
		var formats = {
		"ar-SA" : "dd/MM/yy",
		"bg-BG" : "dd.M.yyyy",
		"ca-ES" : "dd/MM/yyyy",
		"zh-TW" : "yyyy/M/d",
		"cs-CZ" : "d.M.yyyy",
		"da-DK" : "dd-MM-yyyy",
		"de-DE" : "dd.MM.yyyy",
		"el-GR" : "d/M/yyyy",
		"en-US" : "M/d/yyyy",
		"fi-FI" : "d.M.yyyy",
		"fr-FR" : "dd/MM/yyyy",
		"he-IL" : "dd/MM/yyyy",
		"hu-HU" : "yyyy. MM. dd.",
		"is-IS" : "d.M.yyyy",
		"it-IT" : "dd/MM/yyyy",
		"ja-JP" : "yyyy/MM/dd",
		"ko-KR" : "yyyy-MM-dd",
		"nl-NL" : "d-M-yyyy",
		"nb-NO" : "dd.MM.yyyy",
		"pl-PL" : "yyyy-MM-dd",
		"pt-BR" : "d/M/yyyy",
		"ro-RO" : "dd.MM.yyyy",
		"ru-RU" : "dd.MM.yyyy",
		"hr-HR" : "d.M.yyyy",
		"sk-SK" : "d. M. yyyy",
		"sq-AL" : "yyyy-MM-dd",
		"sv-SE" : "yyyy-MM-dd",
		"th-TH" : "d/M/yyyy",
		"tr-TR" : "dd.MM.yyyy",
		"ur-PK" : "dd/MM/yyyy",
		"id-ID" : "dd/MM/yyyy",
		"uk-UA" : "dd.MM.yyyy",
		"be-BY" : "dd.MM.yyyy",
		"sl-SI" : "d.M.yyyy",
		"et-EE" : "d.MM.yyyy",
		"lv-LV" : "yyyy.MM.dd.",
		"lt-LT" : "yyyy.MM.dd",
		"fa-IR" : "MM/dd/yyyy",
		"vi-VN" : "dd/MM/yyyy",
		"hy-AM" : "dd.MM.yyyy",
		"az-Latn-AZ" : "dd.MM.yyyy",
		"eu-ES" : "yyyy/MM/dd",
		"mk-MK" : "dd.MM.yyyy",
		"af-ZA" : "yyyy/MM/dd",
		"ka-GE" : "dd.MM.yyyy",
		"fo-FO" : "dd-MM-yyyy",
		"hi-IN" : "dd-MM-yyyy",
		"ms-MY" : "dd/MM/yyyy",
		"kk-KZ" : "dd.MM.yyyy",
		"ky-KG" : "dd.MM.yy",
		"sw-KE" : "M/d/yyyy",
		"uz-Latn-UZ" : "dd/MM yyyy",
		"tt-RU" : "dd.MM.yyyy",
		"pa-IN" : "dd-MM-yy",
		"gu-IN" : "dd-MM-yy",
		"ta-IN" : "dd-MM-yyyy",
		"te-IN" : "dd-MM-yy",
		"kn-IN" : "dd-MM-yy",
		"mr-IN" : "dd-MM-yyyy",
		"sa-IN" : "dd-MM-yyyy",
		"mn-MN" : "yy.MM.dd",
		"gl-ES" : "dd/MM/yy",
		"kok-IN" : "dd-MM-yyyy",
		"syr-SY" : "dd/MM/yyyy",
		"dv-MV" : "dd/MM/yy",
		"ar-IQ" : "dd/MM/yyyy",
		"zh-CN" : "yyyy/M/d",
		"de-CH" : "dd.MM.yyyy",
		"en-GB" : "dd/MM/yyyy",
		"es-MX" : "dd/MM/yyyy",
		"fr-BE" : "d/MM/yyyy",
		"it-CH" : "dd.MM.yyyy",
		"nl-BE" : "d/MM/yyyy",
		"nn-NO" : "dd.MM.yyyy",
		"pt-PT" : "dd-MM-yyyy",
		"sr-Latn-CS" : "d.M.yyyy",
		"sv-FI" : "d.M.yyyy",
		"az-Cyrl-AZ" : "dd.MM.yyyy",
		"ms-BN" : "dd/MM/yyyy",
		"uz-Cyrl-UZ" : "dd.MM.yyyy",
		"ar-EG" : "dd/MM/yyyy",
		"zh-HK" : "d/M/yyyy",
		"de-AT" : "dd.MM.yyyy",
		"en-AU" : "d/MM/yyyy",
		"es-ES" : "dd/MM/yyyy",
		"fr-CA" : "yyyy-MM-dd",
		"sr-Cyrl-CS" : "d.M.yyyy",
		"ar-LY" : "dd/MM/yyyy",
		"zh-SG" : "d/M/yyyy",
		"de-LU" : "dd.MM.yyyy",
		"en-CA" : "dd/MM/yyyy",
		"es-GT" : "dd/MM/yyyy",
		"fr-CH" : "dd.MM.yyyy",
		"ar-DZ" : "dd-MM-yyyy",
		"zh-MO" : "d/M/yyyy",
		"de-LI" : "dd.MM.yyyy",
		"en-NZ" : "d/MM/yyyy",
		"es-CR" : "dd/MM/yyyy",
		"fr-LU" : "dd/MM/yyyy",
		"ar-MA" : "dd-MM-yyyy",
		"en-IE" : "dd/MM/yyyy",
		"es-PA" : "MM/dd/yyyy",
		"fr-MC" : "dd/MM/yyyy",
		"ar-TN" : "dd-MM-yyyy",
		"en-ZA" : "yyyy/MM/dd",
		"es-DO" : "dd/MM/yyyy",
		"ar-OM" : "dd/MM/yyyy",
		"en-JM" : "dd/MM/yyyy",
		"es-VE" : "dd/MM/yyyy",
		"ar-YE" : "dd/MM/yyyy",
		"en-029" : "MM/dd/yyyy",
		"es-CO" : "dd/MM/yyyy",
		"ar-SY" : "dd/MM/yyyy",
		"en-BZ" : "dd/MM/yyyy",
		"es-PE" : "dd/MM/yyyy",
		"ar-JO" : "dd/MM/yyyy",
		"en-TT" : "dd/MM/yyyy",
		"es-AR" : "dd/MM/yyyy",
		"ar-LB" : "dd/MM/yyyy",
		"en-ZW" : "M/d/yyyy",
		"es-EC" : "dd/MM/yyyy",
		"ar-KW" : "dd/MM/yyyy",
		"en-PH" : "M/d/yyyy",
		"es-CL" : "dd-MM-yyyy",
		"ar-AE" : "dd/MM/yyyy",
		"es-UY" : "dd/MM/yyyy",
		"ar-BH" : "dd/MM/yyyy",
		"es-PY" : "dd/MM/yyyy",
		"ar-QA" : "dd/MM/yyyy",
		"es-BO" : "dd/MM/yyyy",
		"es-SV" : "dd/MM/yyyy",
		"es-HN" : "dd/MM/yyyy",
		"es-NI" : "dd/MM/yyyy",
		"es-PR" : "dd/MM/yyyy",
		"am-ET" : "d/M/yyyy",
		"tzm-Latn-DZ" : "dd-MM-yyyy",
		"iu-Latn-CA" : "d/MM/yyyy",
		"sma-NO" : "dd.MM.yyyy",
		"mn-Mong-CN" : "yyyy/M/d",
		"gd-GB" : "dd/MM/yyyy",
		"en-MY" : "d/M/yyyy",
		"prs-AF" : "dd/MM/yy",
		"bn-BD" : "dd-MM-yy",
		"wo-SN" : "dd/MM/yyyy",
		"rw-RW" : "M/d/yyyy",
		"qut-GT" : "dd/MM/yyyy",
		"sah-RU" : "MM.dd.yyyy",
		"gsw-FR" : "dd/MM/yyyy",
		"co-FR" : "dd/MM/yyyy",
		"oc-FR" : "dd/MM/yyyy",
		"mi-NZ" : "dd/MM/yyyy",
		"ga-IE" : "dd/MM/yyyy",
		"se-SE" : "yyyy-MM-dd",
		"br-FR" : "dd/MM/yyyy",
		"smn-FI" : "d.M.yyyy",
		"moh-CA" : "M/d/yyyy",
		"arn-CL" : "dd-MM-yyyy",
		"ii-CN" : "yyyy/M/d",
		"dsb-DE" : "d. M. yyyy",
		"ig-NG" : "d/M/yyyy",
		"kl-GL" : "dd-MM-yyyy",
		"lb-LU" : "dd/MM/yyyy",
		"ba-RU" : "dd.MM.yy",
		"nso-ZA" : "yyyy/MM/dd",
		"quz-BO" : "dd/MM/yyyy",
		"yo-NG" : "d/M/yyyy",
		"ha-Latn-NG" : "d/M/yyyy",
		"fil-PH" : "M/d/yyyy",
		"ps-AF" : "dd/MM/yy",
		"fy-NL" : "d-M-yyyy",
		"ne-NP" : "M/d/yyyy",
		"se-NO" : "dd.MM.yyyy",
		"iu-Cans-CA" : "d/M/yyyy",
		"sr-Latn-RS" : "d.M.yyyy",
		"si-LK" : "yyyy-MM-dd",
		"sr-Cyrl-RS" : "d.M.yyyy",
		"lo-LA" : "dd/MM/yyyy",
		"km-KH" : "yyyy-MM-dd",
		"cy-GB" : "dd/MM/yyyy",
		"bo-CN" : "yyyy/M/d",
		"sms-FI" : "d.M.yyyy",
		"as-IN" : "dd-MM-yyyy",
		"ml-IN" : "dd-MM-yy",
		"en-IN" : "dd-MM-yyyy",
		"or-IN" : "dd-MM-yy",
		"bn-IN" : "dd-MM-yy",
		"tk-TM" : "dd.MM.yy",
		"bs-Latn-BA" : "d.M.yyyy",
		"mt-MT" : "dd/MM/yyyy",
		"sr-Cyrl-ME" : "d.M.yyyy",
		"se-FI" : "d.M.yyyy",
		"zu-ZA" : "yyyy/MM/dd",
		"xh-ZA" : "yyyy/MM/dd",
		"tn-ZA" : "yyyy/MM/dd",
		"hsb-DE" : "d. M. yyyy",
		"bs-Cyrl-BA" : "d.M.yyyy",
		"tg-Cyrl-TJ" : "dd.MM.yy",
		"sr-Latn-BA" : "d.M.yyyy",
		"smj-NO" : "dd.MM.yyyy",
		"rm-CH" : "dd/MM/yyyy",
		"smj-SE" : "yyyy-MM-dd",
		"quz-EC" : "dd/MM/yyyy",
		"quz-PE" : "dd/MM/yyyy",
		"hr-BA" : "d.M.yyyy.",
		"sr-Latn-ME" : "d.M.yyyy",
		"sma-SE" : "yyyy-MM-dd",
		"en-SG" : "d/M/yyyy",
		"ug-CN" : "yyyy-M-d",
		"sr-Cyrl-BA" : "d.M.yyyy",
		"es-US" : "M/d/yyyy"};
		
		return formatDate(d, formats[culture]);
	}

	// Gets the input controls for a field (used for Textboxes)
	function getInputControl(spField) {
		if (spField.Controls === null) {
			// if running on DispForm.aspx Controls will be null
			return null;
		}
		var controls = $(spField.Controls).find('input');
		if (null !== controls && 1 === controls.length) {
			return controls[0];
		}
		
		throw 'Unable to retrieve the input control for ' + spField.Name;
	}

	function getHashFromInputControls(spField, selector) {
		var oHash = [], i,
			inputs = $(spField.Controls).find(selector),
			labels = $(spField.Controls).find("label");
		if (labels.length < inputs.length) {
			throw "Unable to get hashtable of controls.";
		}
		for (i = 0; i < inputs.length; i++) {
			oHash.push({
				key: $(labels[i]).text(),
				value: inputs[i]
			});
		}
		return oHash;
	}

	function getHashValue(hash, key) {
		var val = null;
		$(hash).each(function (index, pair) {
			if (pair.key === key) {
				val = pair.value;
				return false;
			}
		});
		return val;
	}

	function fillSPFieldInfo(element, fieldParams) {
		// find the HTML comment and fill fieldparams with type and internal name
		for (var n = 0; n < element.childNodes.length; n += 1) {
			if (8 === element.childNodes[n].nodeType) {
				var comment = element.childNodes[n].data;

				// Retrieve field type
				var typeMatches = comment.match(/SPField\w+/);
				if (typeMatches !== null && typeMatches.length > 0) {
				fieldParams.type = typeMatches[0];
				}

				// Retrieve field name
				var nameMatches = comment.match(/FieldName="[^"]+/);
				if (nameMatches !== null && nameMatches.length > 0) {
				fieldParams.name = nameMatches[0].substring(11); // remove FieldName from the beginning
				}

				// Retrieve field internal name
				var internalNameMatches = comment.match(/FieldInternalName="\w+/);
				if (internalNameMatches !== null && internalNameMatches.length > 0) {
				fieldParams.internalName = internalNameMatches[0].substring(19); // remove FieldInternalName from the beginning
				}
				break;
			}
		}

		if (fieldParams.type === null) {
			// SharePoint 2013 April CU removed the HTML comment from list forms
			// so parsing the HTML comment above will not work and type will be null
			var e = $(element).children('span').children().first();
			if (e.prop('tagName') === 'INPUT' && e.attr('id').match(/TextField$/)) {
				if (!isUndefined(e.attr('maxlength'))) {
					// SPFieldText
					fieldParams.type = 'SPFieldText';
					fieldParams.internalName = fieldParams.name;
				} else if (!isUndefined(e.attr('size'))) {
					// SPFieldNumber
					// TODO: how do we distinguish from currency?
					fieldParams.type = 'SPFieldNumber';
					fieldParams.internalName = fieldParams.name;
				}
			} else if ($(element).find('select[name$=ContentTypeChoice]').length > 0) {
				// small hack to support content type fields
				fieldParams.type = 'ContentTypeChoice';
				fieldParams.internalName = 'ContentType';
				fieldParams.name = 'Content Type';
			}
		}
	}

	function getFieldParams(formBody) {
		var elemLabel = null, isRequired = null, fieldName = null;

		var formLabel = $(formBody).siblings(".ms-formlabel");
		if (formLabel !== null) {
			// find element which contains the field's display name
			var elems = formLabel.children('h3');

			// normally, the label is an h3 element inside the td
			// but on surveys the h3 doesn't exist
			// special case: content type label is contained within the td.ms-formlabel
			elemLabel = elems.length > 0 ? elems[0] : formLabel;

			// If label row not null and not attachment row
			if (elemLabel !== null && elemLabel.nodeName !== 'NOBR') {
				fieldName = $.trim($(elemLabel).text());
				if (fieldName.length > 2 && fieldName.substring(fieldName.length-2) === ' *') {
				isRequired = true;
				fieldName = fieldName.substring(0, fieldName.length-2);
				}
			}
		}

		var fieldParams = {
			name: fieldName,
			internalName: null,
			label: elemLabel !== null ? $(elemLabel) : null,
			labelRow: elemLabel !== null ? elemLabel.parentNode : null,
			labelCell: formLabel,
			isRequired: isRequired,
			controlsRow: formBody.parentNode,
			controlsCell: formBody,
			type: null,
			spField: null
		};

		// Retrieve type and internalName
		fillSPFieldInfo(formBody, fieldParams);

		return fieldParams;
	}

	function lazyLoadSPFields() {
		if (_fieldsHashtable !== null && _internalNamesHashtable !== null) {
			return;
		}

		// detect sharepoint version based on global variables which are
		// always defined for sharepoint 2013/2010
		if (typeof _spPageContextInfo === 'object') {
			_spVersion = _spPageContextInfo.webUIVersion === 15 ? 15 : 14;
		}

		_fieldsHashtable = {};
		_internalNamesHashtable = {};

		var formBodies = $('table.ms-formtable td.ms-formbody');
		for (var i = 0; i < formBodies.length; i += 1) {
			var fieldParams = getFieldParams(formBodies[i]);
			if (fieldParams !== null) {
				_fieldsHashtable[fieldParams.name] = fieldParams;
				_internalNamesHashtable[fieldParams.internalName] = fieldParams;
			}
		}
	}

	function toggleSPFieldRows(labelRow, controlsRow, bShowField) {
		// on survey forms, the labelRow and controlsRow are different
		// for normal forms, they are the same so it is a redundant call
		if (bShowField) {
			if (labelRow !== null) {
				$(labelRow).show();
			}
			$(controlsRow).show();
		} else {
			if (labelRow !== null) {
				$(labelRow).hide();
			}
			$(controlsRow).hide();
		}
	}

	function toggleSPField(strFieldName, bShowField) {
		lazyLoadSPFields();

		var fieldParams = _fieldsHashtable[strFieldName];

		if (isUndefined(fieldParams)) {
			throw 'toggleSPField: Unable to find a SPField named ' + strFieldName + ' - ' + bShowField;
		}

		toggleSPFieldRows(fieldParams.labelRow, fieldParams.controlsRow, bShowField);
	}

	/*
	*   SPUtility Classes
	*/

	/*
	*   SPField class
	*   Contains all of the common properties and functions used by the specialized
	*   sub-classes. Typically, this should not be intantiated directly.
	*/
	function SPField(fieldParams) {
		// Public Properties
		this.Label = fieldParams.label;
		this.LabelRow = fieldParams.labelRow;
		this.Name = fieldParams.name;
		this.InternalName = fieldParams.internalName;
		this.IsRequired = fieldParams.isRequired;
		this.Type = fieldParams.type;
		
		var children = $(fieldParams.controlsCell).children("span[dir]"); // support for binding framework e.g. jsviews
		//.children("span").last() will return description control
		if (children.length > 0) {
			this.Controls = children[0];
		} else {
			this.Controls = null;
		}
		this.ControlsRow = fieldParams.controlsRow;
		this.ReadOnlyLabel = null;
	}

	/*
	*   Public SPField Methods
	*/
	SPField.prototype.Show = function () {
		toggleSPFieldRows(this.LabelRow, this.ControlsRow, true);
		return this;
	};

	SPField.prototype.Hide = function () {
		toggleSPFieldRows(this.LabelRow, this.ControlsRow, false);
		return this;
	};

	SPField.prototype.GetDescription = function () {
		if (is2013()) {
			return $(this.Controls.parentNode).children('span.ms-metadata').text();
		} else {
			var ctls = this.Controls.parentNode,
			text = $($(ctls).contents().toArray().reverse()).filter(function() {
				return this.nodeType === 3;
			}).text();
			return text.replace(/^\s+/, '').replace(/\s+$/g, '');
		}
	};
   
	/*
	Only apply to fields without required,
	not include validation logic
	*/
	SPField.prototype.MakeRequired = function(){
		if(!this.IsRequired){
			var $nobr = this.Label.children('nobr');
			if($nobr.children('span.ms-accentText').length === 0){
				$("<span class='ms-accentText' title='This is a required field.'> *</span>").appendTo($nobr);
			}
		}
	};

	SPField.prototype.SetDescription = function (descr) {
		var ctls;
		descr = isUndefined(descr) ? '' : descr;
		if (is2013()) {
			ctls = $(this.Controls.parentNode).children('span.ms-metadata');
			if (ctls.length === 0) {
				ctls = $('<span class="ms-metadata"/>');
				$(this.Controls.parentNode).append(ctls);
			}
			$(ctls).html(descr);
		} else {
			ctls = this.Controls.parentNode;
			// look for the text node
			var textNode = $($(ctls).contents().toArray().reverse()).filter(function() {
				return this.nodeType === 3;
			});
			if (textNode.length === 0) {
				// create a new text node and append it after the other controls
				textNode = document.createTextNode(descr);
				ctls.appendChild(textNode);
			} else {
				$(textNode)[0].nodeValue = descr;
			}
		}
	};

	// should be called in SetValue to update the read-only label
	SPField.prototype._updateReadOnlyLabel = function (htmlToInsert) {
		if (this.ReadOnlyLabel) {
			this.ReadOnlyLabel.html(htmlToInsert);
		}
	};

	// should be called in MakeReadOnly to change a field into read-only mode
	SPField.prototype._makeReadOnly = function (htmlToInsert) {
		try {
			$(this.Controls).hide();
			if (null === this.ReadOnlyLabel) {
				this.ReadOnlyLabel = $('<div/>').addClass('sputility-readonly');
				$(this.Controls).after(this.ReadOnlyLabel);
			}
			this.ReadOnlyLabel.html(htmlToInsert);
			this.ReadOnlyLabel.show();
		} catch (ex) {
			throw 'Error making ' + this.Name + ' read only. ' + ex.toString();
		}
		return this;
	};

	SPField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetValue().toString());
	};

	SPField.prototype.MakeEditable = function () {
		try {
			$(this.Controls).show();
			if (null !== this.ReadOnlyLabel) {
				$(this.ReadOnlyLabel).hide();
			}
		} catch (ex) {
			throw 'Error making ' + this.Name + ' editable. ' + ex.toString();
		}
		return this;
	};

	SPField.prototype.toString = function () {
		return this.Name;
	};

	/*
	*   Public SPField Override Methods
	*   All of the below methods need to be implemented in each sub-class
	*/
	SPField.prototype.GetValue = function () {
		throw 'GetValue not yet implemented for ' + this.Type + ' in ' + this.Name;
	};

	SPField.prototype.SetValue = function () {
		throw 'SetValue not yet implemented for ' + this.Type + ' in ' + this.Name;
	};

	/*
	*   SPTextField class
	*   Supports Single line of text fields
	*/
	function SPTextField(fieldParams) {
		SPField.call(this, fieldParams);
		// public Textbox property
		this.Textbox = getInputControl(this);
	}

	// SPTextField inherits from the SPField base class
	SPTextField.prototype = Object.create(SPField.prototype);

	/*
	*   SPTextField Public Methods
	*   Overrides SPField class methods.
	*/
	SPTextField.prototype.GetValue = function () {
		return $(this.Textbox).val();
	};

	SPTextField.prototype.SetValue = function (value) {
		$(this.Textbox).val(value);
		this._updateReadOnlyLabel(this.GetValue().toString());
		return this;
	};

	SPTextField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(htmlEscape(this.GetValue()));
	};

	/*
	*   SPNumberField class
	*   Supports Number fields
	*/
	function SPNumberField(fieldParams) {
		SPTextField.call(this, fieldParams);
	}

	// SPNumberField inherits from the SPTextField base class
	SPNumberField.prototype = Object.create(SPTextField.prototype);

	/*
	*   SPNumberField Public Methods
	*   Overrides SPTextField class methods.
	*/
	SPNumberField.prototype.GetValue = function () {
		return convertStringToNumber($(this.Textbox).val());
	};

	// override SetValue function to prevent NaN
	SPNumberField.prototype.SetValue = function (value) {
		$(this.Textbox).val(value);
		this._updateReadOnlyLabel(this.GetValueString());
		return this;
	};

	SPNumberField.prototype.GetValueString = function () {
		var val = this.GetValue();
		if (isNaN(val)) {
			val = "";
		} else {
			val = formatMoney(val, 0).toString();
		}
		return val;
	};

	// Override the default MakeReadOnly function to allow displaying
	// empty number fields as empty string instead of NaN
	SPNumberField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetValueString());
	};


	/*
		*   SPCurrencyField class
		*   Supports currency fields (SPCurrencyField)
		*/
	function SPCurrencyField(fieldParams) {
		SPNumberField.call(this, fieldParams);
		this.FormatOptions = {
			eventHandler: null,
			autoCorrect: false,
			decimalPlaces: 2
		};
	}

	// SPCurrencyField inherits from the SPNumberField base class
	SPCurrencyField.prototype = Object.create(SPNumberField.prototype);

	/*
	*   Overrides SPNumberField class methods.
	*/
	SPCurrencyField.prototype.Format = function () {
		if (this.FormatOptions.autoCorrect) {
			this.FormatOptions.eventHandler = $.proxy(function () {
				this.SetValue(this.GetFormattedValue());
			}, this);
			$(this.Textbox).on('change', this.FormatOptions.eventHandler);
			this.FormatOptions.eventHandler(); // run once
		} else {
			if (this.FormatOptions.eventHandler) {
				$(this.Textbox).off('change', this.FormatOptions.eventHandler);
				this.FormatOptions.eventHandler = null;
			}
		}
	};

	SPCurrencyField.prototype.GetFormattedValue = function () {
		var text = this.GetValue();
		if (typeof text === "number") {
			text = formatMoney(text, this.FormatOptions.decimalPlaces);
		}
		return text;
	};

	SPCurrencyField.prototype.SetValue = function (value) {
		$(this.Textbox).val(value);
		this._updateReadOnlyLabel(this.GetFormattedValue());
		return this;
	};

	// Override the default MakeReadOnly function to allow displaying
	// the value with currency symbols
	SPCurrencyField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetFormattedValue());
	};

	/*
	*   ContentTypeChoiceField class
	*   Support for Content Type special field
	*/
	function ContentTypeChoiceField(fieldParams) {
		SPField.call(this, fieldParams);

		// in the content type field, there are no controls other than the
		// dropdown select
		var children = $(fieldParams.controlsCell).children('select[name$=ContentTypeChoice]');
		if (children.length === 0) {
			// something went wrong
			return;
		}

		// therefore, the controls and the dropdown are the same
		this.Controls = this.Dropdown = children[0];
	}

	// Inherit from SPFIeld
	ContentTypeChoiceField.prototype = Object.create(SPField.prototype);

	ContentTypeChoiceField.prototype.GetValue = function () {
		return this.Dropdown.options[this.Dropdown.selectedIndex].text;
	};

	ContentTypeChoiceField.prototype.SetValue = function (value) {
		var i, options, option;
		// allow value to be either the text or the content type's ID
		// so we check option.text and option.value
		options = this.Dropdown.options;
		for (i = 0; i < options.length; i += 1) {
			option = options[i];
			if (option.text === value || option.value === value) {
				this.Dropdown.selectedIndex = i;
				if (typeof ChangeContentType === 'function') {
					// ChangeContentType is a built-in function that is bound to the
					// onchange event on the SELECT control
					// calling the function switches the form to use different
					// fields configured on the content type
					ChangeContentType(this.Dropdown.id);
				}

				break;
			}
		}
		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
	*   SPChoiceField class
	*   Base class for dropdown, radio, and checkbox fields
	*/
	function SPChoiceField(fieldParams) {
		SPField.call(this, fieldParams);

		if (this.Controls === null) {
			return;
		}

		var controls = $(this.Controls).find('input'), numControls = controls.length;
		if (numControls > 1 && controls[numControls - 1].type === "text") {
			// fill-in textbox is always the last input control
			this.FillInTextbox = controls[numControls - 1];
			// fill-in element (radio or checkbox) is always second to last
			this.FillInElement = controls[numControls - 2];
			this.FillInAllowed = true;
		} else {
			this.FillInAllowed = false;
			this.FillInTextbox = null;
			this.FillInElement = null;
		}
	}

	// Inherit from SPField
	SPChoiceField.prototype = Object.create(SPField.prototype);

	SPChoiceField.prototype._getFillInValue = function () {
		return $(this.FillInTextbox).val();
	};

	SPChoiceField.prototype._setFillInValue = function (value) {
		this.FillInElement.checked = true;
		$(this.FillInTextbox).val(value);
	};

	/*
		*   SPDropdownChoiceField class
		*   Supports single select choice fields that show as a dropdown
		*/
	function SPDropdownChoiceField(fieldParams, dropdown) {
		SPChoiceField.call(this, fieldParams);

		if (this.Controls === null) {
			return;
		}

		this.Dropdown = dropdown;
		this.Dropdown = this.Dropdown.length === 1 ? this.Dropdown[0] : [];
	}

	// Inherit from SPChoiceField
	SPDropdownChoiceField.prototype = Object.create(SPChoiceField.prototype);

	SPDropdownChoiceField.prototype.GetValue = function () {
		if (this.FillInAllowed && this.FillInElement.checked === true) {
			return this._getFillInValue();
		}
		return $(this.Dropdown).val();
	};

	SPDropdownChoiceField.prototype.SetValue = function (value) {
		var found = $(this.Dropdown).find('option[value="' + value + '"]').length > 0;
		if (!found && this.FillInAllowed) {
			if (found) {
				$(this.Dropdown).val(value);
				this.FillInElement.checked = false;
			} else {
				this._setFillInValue(value);
			}
		} else if (found) {
			$(this.Dropdown).val(value);
		} else {
			throw 'Unable to set value for ' + this.Name + ' the value "' + value + '" was not found.';
		}
		this._updateReadOnlyLabel(this.GetValue().toString());
		return this;
	};

	/*
	*   SPRadioChoiceField class
	*   Supports single select choice fields that show as radio buttons
	*/
	function SPRadioChoiceField(fieldParams) {
		SPChoiceField.call(this, fieldParams);

		if (this.Controls === null) {
			return;
		}

		this.RadioButtons = getHashFromInputControls(this, 'input[type="radio"]');
		if (this.FillInAllowed) {
			// remove the last radio button, which is to select fill-in value
			this.RadioButtons.pop();
		}
	}

	// Inherit from SPChoiceField
	SPRadioChoiceField.prototype = Object.create(SPChoiceField.prototype);

	SPRadioChoiceField.prototype.GetValue = function () {
		var value = null;
		// find the radio button we need to get in our hashtable
		$(this.RadioButtons).each(function (index, pair) {
			var radioButton = pair.value;
			if (radioButton.checked) {
				value = pair.key;
				return false;
			}
		});

		if (this.FillInAllowed && value === null && this.FillInElement.checked === true) {
			value = $(this.FillInTextbox).val();
		}

		return value;
	};

	SPRadioChoiceField.prototype.SetValue = function (value) {
		// find the radio button we need to set in our hashtable
		var radioButton = getHashValue(this.RadioButtons, value);

		// if couldn't find the element in the hashtable and fill-in
		// is allowed, assume they want to set the fill-in value
		if (null === radioButton) {
			if (this.FillInAllowed) {
				this._setFillInValue(value);
			} else {
				throw 'Unable to set value for ' + this.Name + ' the value "' + value + '" was not found.';
			}
		} else {
			radioButton.checked = true;
		}
		this._updateReadOnlyLabel(this.GetValue().toString());
		return this;
	};
   
	SPRadioChoiceField.prototype.MakeReadOnly = function(){
		return this._makeReadOnly((this.GetValue()||'').toString());
	};

	/*
	*   SPCheckboxChoiceField class
	*   Supports multi-select choice fields which show as checkboxes
	*/
	function SPCheckboxChoiceField(fieldParams) {
		SPChoiceField.call(this, fieldParams);

		if (this.Controls === null) {
			return;
		}

		this.Checkboxes = getHashFromInputControls(this, 'input[type="checkbox"]');

		// when fill-in is allowed, it shows up as an extra checkbox
		// remove it and set the fill-in element because it isn't a normal value
		if (this.FillInAllowed) {
			this.FillInElement = this.Checkboxes.pop().value;
		}
	}

	// Inherit from SPChoiceField
	SPCheckboxChoiceField.prototype = Object.create(SPChoiceField.prototype);

	// display as semicolon delimited list
	SPCheckboxChoiceField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetValue().join("; "));
	};

	SPCheckboxChoiceField.prototype.GetValue = function () {
		var values = [];
		$(this.Checkboxes).each(function (index, pair) {
			var checkbox = pair.value;
			if (checkbox.checked) {
				values.push(pair.key);
			}
		});

		if (this.FillInAllowed && this.FillInElement.checked === true) {
			values.push($(this.FillInTextbox).val());
		}

		return values;
	};

	SPCheckboxChoiceField.prototype.SetValue = function (value, isChecked) {
		var checkbox = getHashValue(this.Checkboxes, value);
		isChecked = isUndefined(isChecked) ? true : isChecked;

		// if couldn't find the element in the hashtable
		// and fill-in is allowed, assume they meant the fill-in value
		if (null === checkbox) {
			if (this.FillInAllowed) {
				checkbox = this.FillInElement;
				$(this.FillInTextbox).val(value);
				checkbox.checked = isChecked;
			} else {
				throw 'Unable to set value for ' + this.Name + ' the value "' + value + '" was not found.';
			}
		} else {
			checkbox.checked = isChecked;
		}

		this._updateReadOnlyLabel(this.GetValue().join("; "));
		return this;
	};

	/*
	* SPDateTimeFieldValue class
	* Used to set/get values for SPDateTimeField fields
	*/
	function SPDateTimeFieldValue(year, month, day, hour, minute, format, separator) {
		this.Year = null;
		this.Month = null;
		this.Day = null;
		this.IsTimeIncluded = false;
		this.Hour = null;
		this.Minute = null;
		this.TimeFormat = null; // 12HR or 24HR
		this.DateSeparator = null;

		if (!isUndefined(year) && !isUndefined(month) && !isUndefined(day)) {
			this.SetDate(year, month, day);
			if (!isUndefined(hour) && !isUndefined(minute)) {
				this.SetTime(hour, minute);
				if (!isUndefined(format)) {
					this.TimeFormat = format;
					if (!isUndefined(separator)) {
						this.DateSeparator = separator;
					}
				}
			}
		}
	}

	/*
	* SPDateTimeFieldValue Public Methods
	*/
	/*
	* Set the date portion of the value
	* year (integer), example: 2014
	* month (integer), example: 5
	* day (integer), example: 14
	*/
	SPDateTimeFieldValue.prototype.SetDate = function (year, month, day) {
		if (isString(year)) {
			year = getInteger(year);
		}
		if (isString(month)) {
			month = getInteger(month);
		}
		if (isString(day)) {
			day = getInteger(day);
		}
		if (!isNumber(year) || !isNumber(month) || !isNumber(day)) {
			throw "Unable to set date, invalid arguments (requires year, month, and day as integers).";
		}
		this.Year = year;
		this.Month = month;
		this.Day = day;
	};

	// hour either an integer 0-23 or a string like '1 PM' or '12 AM'
	// hour either an integer 0-55 or a string like '00' or '35' (must be increments of 5)
	SPDateTimeFieldValue.prototype.SetTime = function (hour, minute) {
		this.IsTimeIncluded = false;
		if (isNumber(hour)) {
			if (hour < 0 || hour > 23) {
				throw 'Hour number parameter must be between 0 and 23.';
			}
			this.Hour = hour;
		} else if (isString(hour)) {
			if (!this.IsValidHour(hour)) {
				throw 'Hour string parameter must be formatted like "1 PM" or "12 AM".';
			}
			this.Hour = this.ConvertHourToNumber(hour);
		}
		if (isNumber(minute)) {
			if (minute < 0 || minute >= 60 || (minute % 5) !== 0) {
				throw 'Minute parameter is not in the correct format. Needs to be formatted like 0, 5, or 35.';
			}
			this.Minute = minute;
		} else if (isString(minute)) {
			if (!this.IsValidMinute(minute)) {
				throw 'Minute parameter is not in the correct format. Needs to be formatted like "00", "05" or "35".';
			}
			this.Minute = getInteger(minute);
		}
		this.IsTimeIncluded = true;
	};

	SPDateTimeFieldValue.prototype.IsValidDate = function () {
		return this.Year !== null && this.Month !== null && this.Day !== null;
	};

	SPDateTimeFieldValue.prototype.IsValidHour = function (h) {
		return !isUndefined(h) && (/^([1-9]|10|11|12) (AM|PM)$/).test(h);
	};

	SPDateTimeFieldValue.prototype.IsValidMinute = function (m) {
		return !isUndefined(m) && (/^([0-5](0|5))$/).test(m);
	};

	SPDateTimeFieldValue.prototype.ConvertHourToNumber = function (str) {
		var hour;
		str = str.split(' ');
		hour = getInteger(str[0]);
		if (str[1] === 'AM') {
			if (hour === 12) {
				hour = 0;
			}
		} else if (str[1] === 'PM') {
			hour += 12;
		}
		return hour;
	};

	// returns the part of a date as a string and pads with a 0 if necessary
	SPDateTimeFieldValue.prototype.PadWithZero = function (d) {
		if (isUndefined(d) || null === d) {
			return '';
		}
		if (isString(d)) {
			d = getInteger(d);
			if (isNaN(d)) {
				return '';
			}
		}
		if (isNumber(d) && d < 10) {
			return '0' + d.toString();
		}
		return d.toString();
	};

	// transforms a date object into a string
	SPDateTimeFieldValue.prototype.GetShortDateString = function () {
		if (!this.IsValidDate()) {
			return '';
		}
		return formatByRegion((new Date(this.Year, this.Month - 1, this.Day)));
	};

	// transforms a date object into a string
	SPDateTimeFieldValue.prototype.GetHour = function () {
		var h = this.Hour;
		if (this.TimeFormat === '12HR') {
			if (h === 0) {
				h = 12;
			} else if (h > 12) {
				h = h - 12;
			}
		}
		return h;
	};

	// transforms a date object into a string
	SPDateTimeFieldValue.prototype.GetShortTimeString = function () {
		if (this.IsTimeIncluded) {
			if (this.TimeFormat === '12HR') {
				// ex: 3/14/2014 1:00 AM
				return this.GetHour() + ':' + this.PadWithZero(this.Minute) + (this.Hour < 12 ? ' AM' : ' PM');
			} else {
				// ex: 14/03/2014 01:00
				return this.PadWithZero(this.GetHour()) + ':' + this.PadWithZero(this.Minute);
			}
		}
		return '';
	};

	SPDateTimeFieldValue.prototype.toString = function () {
		var date = this.GetShortDateString();
		var time = this.GetShortTimeString();
		if (date === '' && time === '') {
			return '';
		} else if (date === '') {
			return '';
		} else if (time === '') {
			return date;
		} else {
			return date + ' ' + time;
		}
	};

	function SPDateTimeField(fieldParams) {
		SPField.call(this, fieldParams);
		this.DateTextbox = getInputControl(this);
		this.HourDropdown = null;
		this.MinuteDropdown = null;
		this.IsDateOnly = true;
		this.HourValueFormat = null;

		if (this.Controls === null) {
			return;
		}

		var timeControls = $(this.Controls).find('select');
		if (null !== timeControls && 2 === timeControls.length) {
			this.HourDropdown = timeControls[0];
			if ($(this.HourDropdown).val().indexOf(' ') > -1) {
				this.HourValueFormat = 'string';
			} else {
				this.HourValueFormat = 'number';
			}
			this.MinuteDropdown = timeControls[1];
			this.IsDateOnly = false;
		}
	}

	// Inherit from SPField
	SPDateTimeField.prototype = Object.create(SPField.prototype);

	SPDateTimeField.prototype.GetValue = function () {
		var rawText = this.GetRawValue();
		var raw = new Date(rawText);

		var spDate = new SPDateTimeFieldValue();
		spDate.TimeFormat = _settings['timeFormat'];
		spDate.DateSeparator = _settings['dateSeparator'];
		
		if(rawText.length > 0 && raw.toString() !== 'Invalid Date'){
			spDate.SetDate(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
			
			if (!this.IsDateOnly) {
			spDate.SetTime(raw.getHours(), raw.getMinutes());
			}
		}

		return spDate;
	};

	SPDateTimeField.prototype.GetRawValue = function(){
		var date = $(this.DateTextbox).val();
		if (!this.IsDateOnly){
			date += " " + getInteger($(this.HourDropdown).val()) + ":" + $(this.MinuteDropdown).val();
		}
		
		return date;
	};

	SPDateTimeField.prototype.SetValue = function (year, month, day, hour, minute) {
		if (isUndefined(year) || year === null || year === "") {
			this.SetDate(null);
			if (!this.IsDateOnly) {
				this.SetTime(null);
			}
			return this;
		}
		this.SetDate(year, month, day);
		if (!isUndefined(hour) && !isUndefined(minute)) {
			this.SetTime(hour, minute);
		}
		return this;
	};

	SPDateTimeField.prototype.SetDate = function (year, month, day) {
		if (year === null || year === "") {
			$(this.DateTextbox).val('');
			return this;
		}
		var spDate = new SPDateTimeFieldValue();
		spDate.TimeFormat = _settings['timeFormat'];
		spDate.DateSeparator = _settings['dateSeparator'];
		spDate.SetDate(year, month, day);
		$(this.DateTextbox).val(spDate.GetShortDateString());
		this._updateReadOnlyLabel(this.GetValue().toString());
		return this;
	};

	SPDateTimeField.prototype.SetTime = function (hour, minute) {
		if (this.IsDateOnly) {
			throw "Unable to set the time for a Date only field.";
		}

		var spDate = new SPDateTimeFieldValue();
		spDate.TimeFormat = _settings['timeFormat'];
		spDate.DateSeparator = _settings['dateSeparator'];

		if (hour === null || hour === "") {
			spDate.SetTime(0, 0);
		} else {
			spDate.SetTime(hour, minute);
		}

		// is the hour dropdown values in string or number format
		// sharepoint 2013 uses number format exclusively
		// sharepoint 2007 uses string format
		// ex: 12 AM versus 0, 1 AM versus 1, etc.
		if (this.HourValueFormat === 'string') {
			var strHour;
			if (spDate.Hour === 0) {
				strHour = '12 AM';
			} else if (spDate.Hour === 12) {
				strHour = '12 PM';
			} else if (spDate.Hour > 12) {
				strHour = (spDate.Hour - 12).toString() + ' PM';
			} else {
				strHour = spDate.Hour.toString() + ' AM';
			}
			$(this.HourDropdown).val(strHour);
		} else {
			$(this.HourDropdown).val(spDate.Hour);
		}

		$(this.MinuteDropdown).val(spDate.PadWithZero(spDate.Minute));

		this._updateReadOnlyLabel(this.GetValue().toString());
		return this;
	};

	/*
	* SPBooleanField class
	* Supports yes/no fields (SPFieldBoolean)
	*/
	function SPBooleanField(fieldParams) {
		SPField.call(this, fieldParams);
		this.Checkbox = getInputControl(this);
	}

	// Inherit from SPField
	SPBooleanField.prototype = Object.create(SPField.prototype);

	/*
	* SPBooleanField Public Methods
	* Overrides SPField class methods.
	*/
	SPBooleanField.prototype.GetValue = function () {
		// double negative to return a boolean value
		return !!this.Checkbox.checked;
	};

	// Get the Yes/No field's value as a string
	// By default this returns Yes when True and No when False
	// Customize this behavior by altering the stringYes and stringNo settings
	SPBooleanField.prototype.GetValueString = function () {
		return this.GetValue() ? _settings['stringYes'] : _settings['stringNo'];
	};

	SPBooleanField.prototype.SetValue = function (value) {
		if (isString(value)) {
			if (_settings['stringYes'].toUpperCase() === value.toUpperCase()) {
				value = true;
			} else {
				value = false;
			}
		} else {
			if (value) {
				value = true;
			} else {
				value = false;
			}
		}
		this.Checkbox.checked = value;
		this._updateReadOnlyLabel(this.GetValueString());
		return this;
	};

	// overriding the default MakeReadOnly function
	// translate true/false to Yes/No
	SPBooleanField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetValueString());
	};

	/*
		* SPURLField class
		* Supports hyperlink fields (SPFieldURL)
		*/
	function SPURLField(fieldParams) {
		SPField.call(this, fieldParams);
		if (this.Controls === null) {
			return;
		}

		this.TextboxURL = null;
		this.TextboxDescription = null;
		this.TextOnly = false;

		var controls = $(this.Controls).find('input');
		if (null !== controls && 2 === controls.length) {
			this.TextboxURL = $(controls[0]);
			this.TextboxDescription = $(controls[1]);
		}
	}

	// Inherit from SPField
	SPURLField.prototype = Object.create(SPField.prototype);

	/*
	* SPURLField Public Methods
	* Overrides SPField class methods.
	*/
	SPURLField.prototype.GetValue = function () {
		return [this.TextboxURL.val(), this.TextboxDescription.val()];
	};

	SPURLField.prototype.SetValue = function (url, description) {
		this.TextboxURL.val(url);
		this.TextboxDescription.val(description);
		this._updateReadOnlyLabel(this.GetHyperlink());
		return this;
	};

	SPURLField.prototype.GetHyperlink = function () {
		var values = this.GetValue();
		var hyperlink;
		if (this.TextOnly) {
			hyperlink = values[0] + ', ' + values[1];
		} else {
			hyperlink = '<a href="' + values[0] + '">' + values[1] + '</a>';
		}
		return hyperlink;
	};

	// overriding the default MakeReadOnly function because we have multiple values returned
	// and we want to have the hyperlink field show up as a URL
	SPURLField.prototype.MakeReadOnly = function (options) {
		if (options && true === options.TextOnly) {
			this.TextOnly = true;
		}

		return this._makeReadOnly(this.GetHyperlink());
	};

	/*
	* SPDropdownLookupField class
	* Supports single select lookup fields
	*/
	function SPDropdownLookupField(fieldParams, elemSelect) {
		SPField.call(this, fieldParams);
		if (this.Controls === null) {
			return;
		}

		if (1 === elemSelect.length) {
			// regular dropdown lookup
			this.Dropdown = elemSelect[0];
		} else {
			throw "Unable to get dropdown element for " + this.Name;
		}
	}

	// Inherit from SPField
	SPDropdownLookupField.prototype = Object.create(SPField.prototype);

	// Return selected option's title or value
	SPDropdownLookupField.prototype.GetValue = function (returnValue) {
		if(returnValue === true){
			return this.Dropdown.options[this.Dropdown.selectedIndex].value;
		}
		return this.Dropdown.options[this.Dropdown.selectedIndex].text;
	};

	SPDropdownLookupField.prototype.SetValue = function (value) {
		if (isNumber(value)) {
			$(this.Dropdown).val(value);
		} else {
			var i, options, option;
			// need to set the dropdown based on text
			options = this.Dropdown.options;
			for (i = 0; i < options.length; i += 1) {
				option = options[i];
				if (option.text === value) {
				this.Dropdown.selectedIndex = i;
				break;
				}
			}
		}
		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
	* SPDropdownLookupField class
	* Supports single select lookup fields
	*/
	function SPAutocompleteLookupField(fieldParams, elemInputs) {
		SPField.call(this, fieldParams);
		if (this.Controls === null) {
			return;
		}

		if (1 === elemInputs.length) {
			// autocomplete lookup
			this.Textbox = $(elemInputs[0]);
			this.HiddenTextbox = $('input[id="' + this.Textbox.attr('optHid') + '"]');
		} else {
			throw "Unable to get input elements for " + this.Name;
		}
	}

	// Inherit from SPField
	SPAutocompleteLookupField.prototype = Object.create(SPField.prototype);

	SPAutocompleteLookupField.prototype.GetValue = function () {
		return this.Textbox.val();
	};

	SPAutocompleteLookupField.prototype.SetValue = function (value) {
		var choices, lookupID, lookupText, i, c = [], pipeIndex;

		// a list item ID was passed to the function so attempt to lookup the text value
		choices = this.Textbox.attr('choices');

		// options are stored in a choices attribute in the following format:
		// (None)|0|Alpha|1|Bravo|2|Charlie|3
		// split the string on every pipe character followed by a digit
		choices = choices.split(/\|(?=\d+)/);
		c.push(choices[0]);
		for (i = 1; i < choices.length - 1; i++) {
			pipeIndex = choices[i].indexOf('|'); // split on the first pipe only
			c.push(choices[i].substring(0, pipeIndex));
			c.push(choices[i].substring(pipeIndex + 1));
		}
		c.push(choices[choices.length - 1]);

		if (isString(value)) {
			// since the pipe character is used as a delimiter above, any values
			// which have a pipe in them were doubled up
			value = value.replace("|", "||");
		}

		// options are stored in a choices attribute in the following format:
		// text|value|text 2|value2
		for (i = 0; i < c.length; i += 2) {
			lookupID = getInteger(c[i + 1]);
			lookupText = c[i];
			// if value is an integer, assume they are passing the list item ID
			// otherwise, a string will match the text value
			if (value === lookupID || value === lookupText) {
				this.Textbox.val(lookupText.replace("||", "|"));
				break;
			}
		}

		if (null !== lookupID) {
			this.HiddenTextbox.val(lookupID);
		}

		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
		* SPPlainNoteField class
		* Supports multi-line plain text fields (SPFieldNote)
		*/
	function SPPlainNoteField(fieldParams, textarea) {
		SPField.call(this, fieldParams);
		this.Textbox = textarea;
		this.TextType = "Plain";
	}

	// Inherit from SPField
	SPPlainNoteField.prototype = Object.create(SPField.prototype);

	SPPlainNoteField.prototype.GetValue = function () {
		return $(this.Textbox).val();
	};

	SPPlainNoteField.prototype.SetValue = function (value) {
		$(this.Textbox).val(value);
		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
	* SPRichNoteField class
	* Supports multi-line rich text fields (SPFieldNote)
	*/
	function SPRichNoteField(fieldParams, textarea) {
		SPPlainNoteField.call(this, fieldParams, textarea);
		this.TextType = "Rich";
	}

	// Inherit from SPField
	SPRichNoteField.prototype = Object.create(SPPlainNoteField.prototype);

	// RTE functions are defined in layouts/1033/form.js
	SPRichNoteField.prototype.GetValue = function () {
		return window.RTE_GetIFrameContents(this.Textbox.id);
	};

	SPRichNoteField.prototype.SetValue = function (value) {
		$(this.Textbox).val(value);
		window.RTE_TransferTextAreaContentsToIFrame(this.Textbox.id);
		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
	* SPEnhancedNoteField class
	* Supports multi-line, enhanced rich text fields in SharePoint 2010/2013 (SPFieldNote)
	*/
	function SPEnhancedNoteField(fieldParams, hiddenInputs) {
		SPField.call(this, fieldParams);
		this.Textbox = hiddenInputs[0];
		this.ContentDiv = $(this.Controls).find('div[contenteditable="true"]')[0];
		this.TextType = "Enhanced";
	}

	// Inherit from SPField
	SPEnhancedNoteField.prototype = Object.create(SPField.prototype);

	SPEnhancedNoteField.prototype.GetValue = function () {
		return $(this.ContentDiv).html();
	};

	SPEnhancedNoteField.prototype.SetValue = function (value) {
		$(this.ContentDiv).html(value);
		$(this.Textbox).val(value);
		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
	* SPFileField class
	* Supports the name field of a Document Library
	*/
	function SPFileField(fieldParams) {
		SPTextField.call(this, fieldParams);
		this.FileExtension = $(this.Textbox).parent().text();
	}

	// Inherit from SPTextField
	SPFileField.prototype = Object.create(SPTextField.prototype);

	/*
	* SPFileField Public Methods
	* Overrides SPTextField class methods.
	*/
	SPFileField.prototype.GetValue = function () {
		return $(this.Textbox).val() + this.FileExtension;
	};

	/*
	* SPLookupMultiField class
	* Supports multi select lookup fields
	*/
	function SPLookupMultiField(fieldParams) {
		SPField.call(this, fieldParams);
		if (this.Controls === null) {
			return;
		}

		var controls = $(this.Controls).find('select');
		if (2 === controls.length) {
			// multi-select lookup
			this.ListChoices = controls[0];
			this.ListSelections = controls[1];
			controls = $(this.Controls).find('button');
			if (controls.length === 0) {
				controls = $(this.Controls).find('input[type="button"]');
			}
			this.ButtonAdd = controls[0];
			this.ButtonRemove = controls[1];
		} else {
			throw "Error initializing SPLookupMultiField named " + this.Name + ", unable to get select controls.";
		}
	}

	// Inherit from SPField
	SPLookupMultiField.prototype = Object.create(SPField.prototype);

	SPLookupMultiField.prototype.GetValue = function () {
		var values = [], i, numOptions;

		numOptions = this.ListSelections.options.length;
		for (i = 0; i < numOptions; i += 1) {
			values.push(this.ListSelections.options[i].text);
		}

		return values;
	};

	// display as semicolon delimited list
	SPLookupMultiField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetValue().join("; "));
	};

	SPLookupMultiField.prototype.SetValue = function (value, addValue) {
		if (isUndefined(addValue)) {
			addValue = true;
		}

		var i, option, options, numOptions, button, prop;

		if (addValue) {
			options = this.ListChoices.options;
			button = this.ButtonAdd;
		} else {
			options = this.ListSelections.options;
			button = this.ButtonRemove;
		}

		numOptions = options.length;

		// select the value
		if (isNumber(value)) {
			value = value.toString();
			prop = "value";
		} else {
			prop = "text";
		}

		for (i = 0; i < numOptions; i += 1) {
			option = options[i];

			if (option[prop] === value) {
				option.selected = true;
				//break; // found what we were looking for
			} else {
				option.selected = false;
			}
		}

		// the button may be disabled if this is the second time
		// we are performing a certain operation
		button.disabled = "";

		// add or remove the value
		$(button).click();

		this._updateReadOnlyLabel(this.GetValue().join("; "));
		return this;
	};

	/*
	* SPUserField class
	* Supports people fields (SPFieldUser)
	*/
	function SPUserField(fieldParams) {
		SPField.call(this, fieldParams);

		if (this.Controls === null) {
			return;
		}

		this.spanUserField = null;
		this.upLevelDiv = null;
		this.textareaDownLevelTextBox = null;
		this.linkCheckNames = null;
		this.txtHiddenSpanData = null;

		var controls = $(this.Controls).find('span.ms-usereditor');
		if (null !== controls && 1 === controls.length) {
			this.spanUserField = controls[0];
			this.upLevelDiv = byid(this.spanUserField.id + '_upLevelDiv');
			this.textareaDownLevelTextBox = byid(this.spanUserField.id + '_downlevelTextBox');
			this.linkCheckNames = byid(this.spanUserField.id + '_checkNames');
			this.txtHiddenSpanData = byid(this.spanUserField.id + '_hiddenSpanData');
		}
	}

	// Inherit from SPField
	SPUserField.prototype = Object.create(SPField.prototype);

	SPUserField.prototype.GetValue = function () {
		return $(this.upLevelDiv).text().replace(/^\s+|\u00A0|\s+$/g, '');
	};

	SPUserField.prototype.SetValue = function (value) {
		this.upLevelDiv.innerHTML = value;
		this.textareaDownLevelTextBox.innerHTML = value;
		if (isInternetExplorer()) { // internet explorer
			$(this.txtHiddenSpanData).val(value);
		}
		this.linkCheckNames.click();
		this._updateReadOnlyLabel(this.GetValue());
		return this;
	};

	/*
	* SPUserField2013 class
	* Supports people fields for SharePoint 2013 (SPFieldUser)
	* To ensure user field load correctly after document ready
	* SP.SOD.executeFunc('clientpeoplepicker.js', 'SPClientPeoplePicker', function(){})
	*/
	function SPUserField2013(fieldParams) {
		SPField.call(this, fieldParams);
		
		this.Controls = fieldParams.controlsCell;
		if (this.Controls === null) {
			return;
		}

		// sharepoint 2013 uses a special autofill named SPClientPeoplePicker
		// _layouts/15/clientpeoplepicker.debug.js
		var pickerDiv = $(this.Controls).find('.sp-peoplepicker-topLevel')[0];
		this.ClientPeoplePicker = window.SPClientPeoplePicker.SPClientPeoplePickerDict[$(pickerDiv).attr('id')];
		this.EditorInput = $(this.Controls).find("[id$='_EditorInput']")[0];

		var that = this;//point to current user field
		this.ClientPeoplePicker.OnUserResolvedClientScript = function(peoplePickerId, selectedUsersInfo){
			if(typeof that.UserResolvedCallBack === 'function'){
				that.UserResolvedCallBack(selectedUsersInfo);
			}
		};
	}

	// Inherit from SPField
	SPUserField2013.prototype = Object.create(SPField.prototype);

	SPUserField2013.prototype.GetValue = function () {
		// returns an array of objects
		return this.ClientPeoplePicker.GetAllUserInfo();
	};

	// Iterates over all entities currently in the field, gets the user ID
	// for each one, and builds an HTML link
	// callback should be a function which takes one parameter for the returned HTML
	SPUserField2013.prototype._getValueLinks = function (callback) {
		// TODO: doesn't support sharepoint groups
		
		var tmpArray = [], self = this;
		
			// build an array of all the entities currently resolved
			$.each(self.GetValue(), function (key, val) {
				if (val.Key !== null) {
					tmpArray.push(val.Key);
				}
			});

			function successCallback(parms) {
				var o = { 'users': parms.users };
				parms.d.resolve(o);
			}

			function failCallback(parms) {
				parms.d.reject("Something went wrong...");
			}

			function getUserId(loginNames, field) {
				var d = $.Deferred();
				var context = new SP.ClientContext.get_current();
				var arrayLength = loginNames.length;
				var users = [];
				
				for (var i = 0; i < arrayLength; i++) {
					var user = context.get_web().ensureUser(loginNames[i]);
					context.load(user);
					users.push(user);
				}
				
				var parms = { d: d, loginNames: loginNames, users: users };
				context.executeQueryAsync(
					successCallback.bind(field, parms),
					failCallback.bind(field, parms));
				return d.promise();
			}

			var x = getUserId(tmpArray, self);

			x.done(function (result) {
				// result is an SP.List because that is what we passed to resolve()!
				var htmlText = "";
				for (var i = 0; i < result.users.length; i++) {
					var user = result.users[i];
					if (htmlText !== "") { htmlText += "; "; }
					htmlText += '<a href="/_layouts/15/userdisp.aspx?ID=' + user.get_id().toString() + '&amp;RootFolder=*">' + user.get_title() + '</a>';
				}
				// finally! send the result to our callback
				return callback(htmlText);
			});

			x.fail(function (result) {
				// result is a string because that is what we passed to reject()!
				var error = result;
				console.log(error);
			});
	};

	// should be called in SetValue to update the read-only label
	SPUserField2013.prototype._updateReadOnlyLabel = function () {
		var self = this;
		if (self.ReadOnlyLabel) {
			self.ReadOnlyLabel.html(self.GetValueString());
		}
	};

	// Get the field's value as a comma delimited string
	SPUserField2013.prototype.GetValueString = function() {
		return $.map(this.GetValue(), function (val) {
			return val.DisplayText || val.AutoFillDisplayText;
		}).join(", ");
	};

   	SPUserField2013.prototype.SetValue = function (value) {
		var that = this;
		if (isUndefined(value) || value === null || value === '') {
			// delete the user if passed null/empty
			this.GetValue().forEach(function(){
				that.ClientPeoplePicker.DeleteProcessedUser();
			});
		} else {
			if(this.ClientPeoplePicker.AllowMultipleUsers){
				value.split(';').forEach(function(v){
					$(that.EditorInput).val(v);
					that.ClientPeoplePicker.AddUnresolvedUserFromEditor(true);
				});
			} else {
				$(this.EditorInput).val(value);
				this.ClientPeoplePicker.AddUnresolvedUserFromEditor(true);
			}
		}
		// schedule a callback to update the read-only label if necessary
		this._updateReadOnlyLabel();
		return this;
	};

	// Make the field read only and display a link to each person or group
	SPUserField2013.prototype.MakeReadOnly = function () {
		// make the field read-only
		// field will display empty until callback resolves in _updateReadOnlyLabel
		this._makeReadOnly('');
		// schedule callback to update read only label
		this._updateReadOnlyLabel();
		return this;
	};
   
	/* SPTaxonomyField class
		* Supports metadata column
		*/
	function SPTaxonomyField(fieldParams){
		SPField.call(this, fieldParams);
		this.Controls = fieldParams.controlsCell;
		
		if(this.Controls === null){
			return;
		}
		
		this.ClientTaxonomyWebTaggingControl = null;
		
		var divContainer = $(this.Controls).find("div[id='" + fieldParams.internalName + "_$container']")[0];
		if(divContainer){
			if(typeof Microsoft === "object" && typeof Microsoft.SharePoint === "object" && typeof Microsoft.SharePoint.Taxonomy === "object"){
				this.ClientTaxonomyWebTaggingControl = new Microsoft.SharePoint.Taxonomy.ControlObject(divContainer);
			}
		}
	}
   
	// Inherit from SPField
	SPTaxonomyField.prototype = Object.create(SPField.prototype);

	SPTaxonomyField.prototype.GetValue = function () {
		if(this.ClientTaxonomyWebTaggingControl !== null){
			var terms = this.ClientTaxonomyWebTaggingControl.getRawText();
			return terms.length < 1 ? [] : 
				terms.split(_settings['termSeparator']).map(function(t){
					var term = t.split(_settings['termLabelSeparator']);
					return {label: term[0], guid: term[1]};
				});
		}
		return [];
	};
   
	SPTaxonomyField.prototype.GetValueString = function () {
		return this.GetValue().map(function(v){ return v.label; }).join(_settings['termSeparator']);
	};
   
	SPTaxonomyField.prototype.GetRawValue = function(){
		if(this.ClientTaxonomyWebTaggingControl !== null){
			return this.ClientTaxonomyWebTaggingControl.getRawText();
		}
		return '';
	};
   
	SPTaxonomyField.prototype.SetValue = function(termValues){
		if(this.ClientTaxonomyWebTaggingControl !== null){
			this.ClientTaxonomyWebTaggingControl.setRawText(termValues);
			this.ClientTaxonomyWebTaggingControl.retrieveTerms();
		}
	};

	SPTaxonomyField.prototype.MakeReadOnly = function () {
		return this._makeReadOnly(this.GetValueString());
	};

	// Inherit from SPField
	function SPAttachmentField(fieldParams) {
		SPField.call(this, fieldParams);
		this.Controls = $('#idAttachmentsTable', this.controlsCell)[0];
	}
	SPAttachmentField.prototype = Object.create(SPField.prototype);
	SPAttachmentField.prototype.GetValue = function(){
		var attachments = [];
		if(this.Controls){
			attachments = $(this.Controls).find('a').map(function(idx, ele){
				return ele.innerText;
			});
		}

		return attachments;
	};
	
	/*
	*   SPDispFormTextField class
	*   Supports DispForm text fields
	*/
	function SPDispFormTextField(fieldParams, textNode) {
		SPField.call(this, fieldParams);
		this.Controls = fieldParams.controlsCell;
		this.TextNode = textNode;
	}

	// SPDispFormField inherits from the SPField base class
	SPDispFormTextField.prototype = Object.create(SPField.prototype);

	/*
	*   SPDispFormField Public Methods
	*   Overrides SPField class methods.
	*/
	SPDispFormTextField.prototype.GetValue = function () {
		return $.trim($(this.TextNode).text());
	};

	SPDispFormTextField.prototype.SetValue = function (value) {
		this.TextNode.nodeValue = value;
		return this;
	};

	SPDispFormTextField.prototype.MakeEditable = function () {
		// does nothing
		return this;
	};

	SPDispFormTextField.prototype.MakeReadOnly = function () {
		// does nothing, already read-only
		return this;
	};

	/*
	*   SPDispFormField class
	*   Supports DispForm html fields
	*/
	function SPDispFormField(fieldParams, element) {
		SPField.call(this, fieldParams);
		this.Controls = fieldParams.controlsCell;
		this.Element = element;
	}

	// SPDispFormField inherits from the SPField base class
	SPDispFormField.prototype = Object.create(SPField.prototype);

	/*
	*   SPDispFormField Public Methods
	*   Overrides SPField class methods.
	*/
	SPDispFormField.prototype.GetValue = function () {
		// TODO: need to figure out some more advanced parsing
		return $(this.Element).text();
	};

	SPDispFormField.prototype.SetValue = function () {
		// TODO: not supported yet
		return this;
	};

	SPDispFormField.prototype.MakeEditable = function () {
		// does nothing
		return this;
	};

	SPDispFormField.prototype.MakeReadOnly = function () {
		// does nothing, already read-only
		return this;
	};

	function getSPFieldFromType(spFieldParams) {
		var field = null, controls;

		if (isDispForm()) {
			// DispForm fields display differently
			controls = spFieldParams.controlsCell.childNodes;
			if (controls.length === 5) {
				// fields which have an HTML element
				return new SPDispFormField(spFieldParams, controls[3]);
			}
			// fields which have a text node element
			return new SPDispFormTextField(spFieldParams, controls[2]);
		}

		switch (spFieldParams.type) {
			case 'SPFieldText':
				field = new SPTextField(spFieldParams);
				break;
			case 'SPFieldNumber':
				field = new SPNumberField(spFieldParams);
				break;
			case 'SPFieldCurrency':
				field = new SPCurrencyField(spFieldParams);
				break;
			case 'ContentTypeChoice': // special type for content type field
				field = new ContentTypeChoiceField(spFieldParams);
				break;
			case 'SPFieldChoice':
				// is this a normal dropdown field?
				controls = $(spFieldParams.controlsCell).find('select');
				if (controls.length > 0) {
					field = new SPDropdownChoiceField(spFieldParams, controls);
				} else {
					field = new SPRadioChoiceField(spFieldParams);
				}
				break;
			case 'SPFieldMultiChoice':
				field = new SPCheckboxChoiceField(spFieldParams);
				break;
			case 'SPFieldDateTime':
				field = new SPDateTimeField(spFieldParams);
				break;
			case 'SPFieldBoolean':
				field = new SPBooleanField(spFieldParams);
				break;
			case 'SPFieldUser':
			case 'SPFieldUserMulti':
			case 'SPFieldBusinessData':
				if (typeof window.SPClientPeoplePicker === 'undefined') {
					field = new SPUserField(spFieldParams);
				} else {
					field = new SPUserField2013(spFieldParams);
				}
				break;
			case 'SPFieldURL':
				field = new SPURLField(spFieldParams);
				break;
			case 'SPFieldLookup':
				// is this a normal dropdown field?
				controls = $(spFieldParams.controlsCell).find('select');
				if (controls.length > 0) {
					field = new SPDropdownLookupField(spFieldParams, controls);
				} else {
					controls = $(spFieldParams.controlsCell).find('input');
					field = new SPAutocompleteLookupField(spFieldParams, controls);
				}
				break;
			case 'SPFieldNote':
				controls = $(spFieldParams.controlsCell).find('textarea');
				if (controls.length > 0) {
					// either plain text or rich text
					controls = controls[0];
					if (window.RTE_GetEditorIFrame && window.RTE_GetEditorIFrame(controls.id) !== null) {
						// rich text field detected
						field = new SPRichNoteField(spFieldParams, controls);
					}
				} else {
					controls = $(spFieldParams.controlsCell).find('input[type="hidden"]');
					// is this an "enhanced rich text field" in sp 2010/2013?
					if (controls.length >= 1) {
					field = new SPEnhancedNoteField(spFieldParams, controls);
					}
				}
				if (null === field) {
					// default to plain text note field (on DispForm there is no way to tell)
					field = new SPPlainNoteField(spFieldParams, controls);
				}
				break;
			case 'SPFieldFile':
				field = new SPFileField(spFieldParams);
				break;
			case 'SPFieldLookupMulti':
				field = new SPLookupMultiField(spFieldParams);
				break;
			case 'SPFieldTaxonomyFieldType':
			case 'SPFieldTaxonomyFieldTypeMulti':
				field = new SPTaxonomyField(spFieldParams);
				break;
			case 'SPFieldAttachments':
				field = new SPAttachmentField(spFieldParams);
				break;
			default:
				field = new SPField(spFieldParams);
				break;
		}
		return field;
	}

	/*
	* Create an instance of the correct class based on the field's type
	*/
	function createSPField(spFieldParams) {
		try {
			// if we can't get the type then we can't create the field
			if (null === spFieldParams.type) {
				throw 'Unknown SPField type.';
			}
			return getSPFieldFromType(spFieldParams);
		} catch (e) {
			throw 'Error creating field named ' + spFieldParams.name + ': ' + e.toString();
		}
	}
	
	/**
	*   SPUtility Global object and Public Methods
	**/
	var SPUtility = {};
	SPUtility.Debug = function () {
		// Debug method has been deprecated in favor of
		// exceptions being thrown from the library
		// Catch the exception, then use console.log or alert
		return false;
	};

	// Searches the page for a specific field by name
	SPUtility.GetSPField = function (strFieldName) {
		lazyLoadSPFields();

		var fieldParams = _fieldsHashtable[strFieldName];

		if (isUndefined(fieldParams)) {
			throw 'Unable to get a SPField named ' + strFieldName;
		}

		if (fieldParams.spField === null) {
			// field hasn't been initialized yet
			fieldParams.spField = createSPField(fieldParams);
		}

		return fieldParams.spField;
	};

	SPUtility.GetSPFieldByInternalName = function (strInternalName) {
		lazyLoadSPFields();

		var fieldParams = _internalNamesHashtable[strInternalName];

		if (isUndefined(fieldParams)) {
			throw 'Unable to get a SPField with internal name ' + strInternalName;
		}

		if (fieldParams.spField === null) {
			// field hasn't been initialized yet
			fieldParams.spField = createSPField(fieldParams);
		}

		return fieldParams.spField;
	};

	// Gets all of the SPFields by name on the page
	SPUtility.GetSPFields = function () {
		lazyLoadSPFields();
		return _fieldsHashtable;
	};

	// Gets all of the SPFields by internal name on the page
	SPUtility.GetSPFieldsInternal = function () {
		lazyLoadSPFields();
		return _internalNamesHashtable;
	};

	SPUtility.HideSPField = function (strFieldName) {
		toggleSPField(strFieldName, false);
	};

	SPUtility.ShowSPField = function (strFieldName) {
		toggleSPField(strFieldName, true);
	};

	/*
	* True if the current page is the DispForm. Otherwise, will return
	* False if it is EditForm or NewForm.
	*/
	SPUtility.IsDispForm = function () {
		return isDispForm();
	};

   /*
	* Configure SPUtility by passing an object containing settings.
	_settings = {                 // DEFAULT SETTINGS:
	  'timeFormat': '12HR',      // 12HR or 24HR
	  'dateSeparator': '/',      // separates month/day/year with / or .
	  'dateFormat': 'MM/dd/yyyy', //format for only date
	  'dateTimeFormat': 'MM/dd/yyyy HH:mm:ss', //format for date with time
	  'decimalSeparator': '.',   // separates decimal from number
	  'thousandsSeparator': ',', // separates thousands in number
	  'stringYes': 'Yes',        // Text for when boolean field is True
	  'stringNo': 'No',          // Text for when boolean field is False
	  'termSeparator': ';',      // separates terms
	  'termLabelSeparator': '|'  // separates term from guid
	}
   */
	SPUtility.Setup = function (settings) {
		var s = $.extend( {}, _settings, settings );
		// validate the passed settings
		if (s['timeFormat'] !== '12HR' && s['timeFormat'] !== '24HR') {
			throw "Unable to set timeFormat, should be 12HR or 24HR.";
		}
		// TODO: validate other settings?
		_settings = s;
		return s;
	};

	// deprecated
	SPUtility.GetTimeFormat = function () {
		return _settings['timeFormat'];
	};

	// deprecated
	SPUtility.SetTimeFormat = function (format) {
		SPUtility.Setup({ 'timeFormat': format });
	};

	// deprecated
	SPUtility.GetDateSeparator = function () {
		return _settings['dateSeparator'];
	};

	// deprecated
	SPUtility.SetDateSeparator = function (separator) {
		SPUtility.Setup({ 'dateSeparator': separator });
	};

	// deprecated
	SPUtility.GetDecimalSeparator = function () {
		return _settings['decimalSeparator'];
	};

	// deprecated
	SPUtility.SetDecimalSeparator = function (separator) {
		SPUtility.Setup({ 'decimalSeparator': separator });
	};

	// deprecated
	SPUtility.GetThousandsSeparator = function () {
		return _settings['thousandsSeparator'];
	};

	// deprecated
	SPUtility.SetThousandsSeparator = function (separator) {
		SPUtility.Setup({ 'thousandsSeparator': separator });
	};
	
	return SPUtility;
}(jQuery));