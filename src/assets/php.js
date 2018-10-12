function json_decode(str_json) {
	//       discuss at: http://phpjs.org/functions/json_decode/
	//      original by: Public Domain (http://www.json.org/json2.js)
	// reimplemented by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	//      improved by: T.J. Leahy
	//      improved by: Michael White
	//        example 1: json_decode('[ 1 ]');
	//        returns 1: [1]

	/*
	  http://www.JSON.org/json2.js
	  2008-11-19
	  Public Domain.
	  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
	  See http://www.JSON.org/js.html
	 */

	var json = this.window.JSON;
	if (typeof json === 'object' && typeof json.parse === 'function') {
		try {
			return json.parse(str_json);
		} catch (err) {
			if (!(err instanceof SyntaxError)) {
				throw new Error('Unexpected error type in json_decode()');
			}
			this.php_js = this.php_js || {};
			this.php_js.last_error_json = 4; // usable by json_last_error()
			return null;
		}
	}

	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	var j;
	var text = str_json;

	// Parsing happens in four stages. In the first stage, we replace certain
	// Unicode characters with escape sequences. JavaScript handles many characters
	// incorrectly, either silently deleting them, or treating them as line endings.
	cx.lastIndex = 0;
	if (cx.test(text)) {
		text = text.replace(cx, function(a) {
			return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		});
	}

	// In the second stage, we run the text against regular expressions that look
	// for non-JSON patterns. We are especially concerned with '()' and 'new'
	// because they can cause invocation, and '=' because it can cause mutation.
	// But just to be safe, we want to reject all unexpected forms.
	// We split the second stage into 4 regexp operations in order to work around
	// crippling inefficiencies in IE's and Safari's regexp engines. First we
	// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
	// replace all simple value tokens with ']' characters. Third, we delete all
	// open brackets that follow a colon or comma or that begin the text. Finally,
	// we look to see that the remaining characters are only whitespace or ']' or
	// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
	if ((/^[\],:{}\s]*$/).test(text.replace(
			/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(
			/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
			']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

		// In the third stage we use the eval function to compile the text into a
		// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
		// in JavaScript: it can begin a block or an object literal. We wrap the text
		// in parens to eliminate the ambiguity.
		j = eval('(' + text + ')');

		return j;
	}

	this.php_js = this.php_js || {};
	this.php_js.last_error_json = 4; // usable by json_last_error()
	return null;
}

function json_encode(mixed_val) {
	//       discuss at: http://phpjs.org/functions/json_encode/
	//      original by: Public Domain (http://www.json.org/json2.js)
	// reimplemented by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	//      improved by: Michael White
	//         input by: felix
	//      bugfixed by: Brett Zamir (http://brett-zamir.me)
	//        example 1: json_encode('Kevin');
	//        returns 1: '"Kevin"'

	/*
	  http://www.JSON.org/json2.js
	  2008-11-19
	  Public Domain.
	  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
	  See http://www.JSON.org/js.html
	 */
	var retVal, json = this.window.JSON;
	try {
		if (typeof json === 'object' && typeof json.stringify === 'function') {
			retVal = json.stringify(mixed_val); // Errors will not be caught here if our own equivalent to resource
			//  (an instance of PHPJS_Resource) is used
			if (retVal === undefined) {
				throw new SyntaxError('json_encode');
			}
			return retVal;
		}

		var value = mixed_val;

		var quote = function(string) {
			var escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
			var meta = { // table of character substitutions
				'\b' : '\\b',
				'\t' : '\\t',
				'\n' : '\\n',
				'\f' : '\\f',
				'\r' : '\\r',
				'"' : '\\"',
				'\\' : '\\\\'
			};

			escapable.lastIndex = 0;
			return escapable.test(string) ? '"'
					+ string.replace(escapable, function(a) {
						var c = meta[a];
						return typeof c === 'string' ? c : '\\u'
								+ ('0000' + a.charCodeAt(0).toString(16))
										.slice(-4);
					}) + '"' : '"' + string + '"';
		};

		var str = function(key, holder) {
			var gap = '';
			var indent = '    ';
			var i = 0; // The loop counter.
			var k = ''; // The member key.
			var v = ''; // The member value.
			var length = 0;
			var mind = gap;
			var partial = [];
			var value = holder[key];

			// If the value has a toJSON method, call it to obtain a replacement value.
			if (value && typeof value === 'object'
					&& typeof value.toJSON === 'function') {
				value = value.toJSON(key);
			}

			// What happens next depends on the value's type.
			switch (typeof value) {
			case 'string':
				return quote(value);

			case 'number':
				// JSON numbers must be finite. Encode non-finite numbers as null.
				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
			case 'null':
				// If the value is a boolean or null, convert it to a string. Note:
				// typeof null does not produce 'null'. The case is included here in
				// the remote chance that this gets fixed someday.
				return String(value);

			case 'object':
				// If the type is 'object', we might be dealing with an object or an array or
				// null.
				// Due to a specification blunder in ECMAScript, typeof null is 'object',
				// so watch out for that case.
				if (!value) {
					return 'null';
				}
				if ((this.PHPJS_Resource && value instanceof this.PHPJS_Resource)
						|| (window.PHPJS_Resource && value instanceof window.PHPJS_Resource)) {
					throw new SyntaxError('json_encode');
				}

				// Make an array to hold the partial results of stringifying this object value.
				gap += indent;
				partial = [];

				// Is the value an array?
				if (Object.prototype.toString.apply(value) === '[object Array]') {
					// The value is an array. Stringify every element. Use null as a placeholder
					// for non-JSON values.
					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}

					// Join all of the elements together, separated with commas, and wrap them in
					// brackets.
					v = partial.length === 0 ? '[]' : gap ? '[\n' + gap
							+ partial.join(',\n' + gap) + '\n' + mind + ']'
							: '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}

				// Iterate through all of the keys in the object.
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ': ' : ':') + v);
						}
					}
				}

				// Join all of the member texts together, separated with commas,
				// and wrap them in braces.
				v = partial.length === 0 ? '{}' : gap ? '{\n' + gap
						+ partial.join(',\n' + gap) + '\n' + mind + '}' : '{'
						+ partial.join(',') + '}';
				gap = mind;
				return v;
			case 'undefined':
				// Fall-through
			case 'function':
				// Fall-through
			default:
				throw new SyntaxError('json_encode');
			}
		};

		// Make a fake root object containing our value under the key of ''.
		// Return the result of stringifying the value.
		return str('', {
			'' : value
		});

	} catch (err) { // Todo: ensure error handling above throws a SyntaxError in all cases where it could
		// (i.e., when the JSON global is not available and there is an error)
		if (!(err instanceof SyntaxError)) {
			throw new Error('Unexpected error type in json_encode()');
		}
		this.php_js = this.php_js || {};
		this.php_js.last_error_json = 4; // usable by json_last_error()
		return null;
	}
}

function base64_decode(encodedData) { // eslint-disable-line camelcase
	//  discuss at: http://locutus.io/php/base64_decode/
	// original by: Tyler Akins (http://rumkin.com)
	// improved by: Thunder.m
	// improved by: Kevin van Zonneveld (http://kvz.io)
	// improved by: Kevin van Zonneveld (http://kvz.io)
	//    input by: Aman Gupta
	//    input by: Brett Zamir (http://brett-zamir.me)
	// bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
	// bugfixed by: Pellentesque Malesuada
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	//   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==')
	//   returns 1: 'Kevin van Zonneveld'
	//   example 2: base64_decode('YQ==')
	//   returns 2: 'a'
	//   example 3: base64_decode('4pyTIMOgIGxhIG1vZGU=')
	//   returns 3: '✓ à la mode'
	if (typeof window !== 'undefined') {
		if (typeof window.atob !== 'undefined') {
			return decodeURIComponent(encodeURIComponent(window
					.atob(encodedData)))
		}
	} else {
		return new Buffer(encodedData, 'base64').toString('utf-8')
	}
	var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	var o1
	var o2
	var o3
	var h1
	var h2
	var h3
	var h4
	var bits
	var i = 0
	var ac = 0
	var dec = ''
	var tmpArr = []
	if (!encodedData) {
		return encodedData
	}
	encodedData += ''
	do {
		// unpack four hexets into three octets using index points in b64
		h1 = b64.indexOf(encodedData.charAt(i++))
		h2 = b64.indexOf(encodedData.charAt(i++))
		h3 = b64.indexOf(encodedData.charAt(i++))
		h4 = b64.indexOf(encodedData.charAt(i++))
		bits = h1 << 18 | h2 << 12 | h3 << 6 | h4
		o1 = bits >> 16 & 0xff
		o2 = bits >> 8 & 0xff
		o3 = bits & 0xff
		if (h3 === 64) {
			tmpArr[ac++] = String.fromCharCode(o1)
		} else if (h4 === 64) {
			tmpArr[ac++] = String.fromCharCode(o1, o2)
		} else {
			tmpArr[ac++] = String.fromCharCode(o1, o2, o3)
		}
	} while (i < encodedData.length)
	dec = tmpArr.join('')
	return decodeURIComponent(encodeURIComponent(dec.replace(/\0+$/, '')))
}